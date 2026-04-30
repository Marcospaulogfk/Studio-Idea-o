-- ============================================================
-- HARDENING DE RLS — single-admin permissivo → role-based
-- ============================================================
-- Substitui as policies "auth_all" (qualquer authenticated tem tudo)
-- por policies que checam o role em public.users via funções
-- SECURITY DEFINER, com cláusula de bootstrap pra não travar acesso
-- caso o backfill falhe ou a configuração esteja em transição.
--
-- Idempotente — pode ser re-rodado sem erros.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. is_admin() — checa role do user atual com fallback bootstrap
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_role TEXT;
BEGIN
  v_email := auth.jwt() ->> 'email';
  IF v_email IS NULL THEN RETURN FALSE; END IF;

  SELECT role INTO v_role FROM public.users WHERE email = v_email AND active = true;
  IF v_role = 'admin' THEN RETURN TRUE; END IF;

  -- Bootstrap: se nenhum admin existe, qualquer authenticated entra
  -- (cenário de instalação inicial ou recuperação)
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE role = 'admin' AND active = true) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_manager_or_admin() RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_role TEXT;
BEGIN
  v_email := auth.jwt() ->> 'email';
  IF v_email IS NULL THEN RETURN FALSE; END IF;

  SELECT role INTO v_role FROM public.users WHERE email = v_email AND active = true;
  IF v_role IN ('admin', 'manager') THEN RETURN TRUE; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE role = 'admin' AND active = true) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- ============================================================
-- 2. Trigger: cria public.users automaticamente em novos signups
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    -- Primeiro user do sistema vira admin, demais viram operator
    CASE WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE role = 'admin') THEN 'admin' ELSE 'operator' END,
    true
  )
  ON CONFLICT (email) DO UPDATE SET id = EXCLUDED.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================
-- 3. Backfill: cria public.users pra auth.users existentes
--    sem profile, e linka emails coincidentes
-- ============================================================
INSERT INTO public.users (id, email, name, role, active)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  'admin',  -- estágio single-admin: o user logado vira admin
  true
FROM auth.users au
WHERE au.email IS NOT NULL
ON CONFLICT (email) DO UPDATE SET
  id = EXCLUDED.id,  -- linka email do seed com auth.users.id real
  active = true;

-- ============================================================
-- 4. Substitui auth_all permissivo por policies role-based
-- ============================================================

-- Drop antigas (auth_all)
DROP POLICY IF EXISTS "auth_all" ON clients;
DROP POLICY IF EXISTS "auth_all" ON leads;
DROP POLICY IF EXISTS "auth_all" ON followups;
DROP POLICY IF EXISTS "auth_all" ON sales;
DROP POLICY IF EXISTS "auth_all" ON packages;
DROP POLICY IF EXISTS "auth_all" ON productions;
DROP POLICY IF EXISTS "auth_all" ON financials;
DROP POLICY IF EXISTS "auth_all" ON aftersales;
DROP POLICY IF EXISTS "auth_all" ON file_assets;
DROP POLICY IF EXISTS "auth_all" ON notifications;
DROP POLICY IF EXISTS "auth_all" ON users;

-- Drop admin/manager/operator antigas (caso existam de tentativa anterior)
DROP POLICY IF EXISTS "admin_all" ON clients;
DROP POLICY IF EXISTS "admin_all" ON leads;
DROP POLICY IF EXISTS "admin_all" ON followups;
DROP POLICY IF EXISTS "admin_all" ON sales;
DROP POLICY IF EXISTS "admin_all" ON packages;
DROP POLICY IF EXISTS "admin_all" ON productions;
DROP POLICY IF EXISTS "admin_all" ON financials;
DROP POLICY IF EXISTS "admin_all" ON aftersales;
DROP POLICY IF EXISTS "admin_all" ON file_assets;
DROP POLICY IF EXISTS "admin_all" ON notifications;
DROP POLICY IF EXISTS "admin_all" ON users;
DROP POLICY IF EXISTS "manager_read" ON financials;
DROP POLICY IF EXISTS "manager_all"  ON clients;
DROP POLICY IF EXISTS "manager_all"  ON leads;
DROP POLICY IF EXISTS "manager_all"  ON sales;
DROP POLICY IF EXISTS "operator_productions" ON productions;
DROP POLICY IF EXISTS "operator_leads" ON leads;
DROP POLICY IF EXISTS "operator_notifications" ON notifications;

-- Admin: acesso total via is_admin()
CREATE POLICY "admin_all" ON clients       FOR ALL USING (is_admin());
CREATE POLICY "admin_all" ON leads         FOR ALL USING (is_admin());
CREATE POLICY "admin_all" ON followups     FOR ALL USING (is_admin());
CREATE POLICY "admin_all" ON sales         FOR ALL USING (is_admin());
CREATE POLICY "admin_all" ON packages      FOR ALL USING (is_admin());
CREATE POLICY "admin_all" ON productions   FOR ALL USING (is_admin());
CREATE POLICY "admin_all" ON financials    FOR ALL USING (is_admin());
CREATE POLICY "admin_all" ON aftersales    FOR ALL USING (is_admin());
CREATE POLICY "admin_all" ON file_assets   FOR ALL USING (is_admin());
CREATE POLICY "admin_all" ON notifications FOR ALL USING (is_admin());
CREATE POLICY "admin_all" ON users         FOR ALL USING (is_admin());

-- Manager: vendas/clientes/leads/financeiro readonly
CREATE POLICY "manager_read" ON financials FOR SELECT USING (is_manager_or_admin());
CREATE POLICY "manager_all"  ON clients    FOR ALL    USING (is_manager_or_admin());
CREATE POLICY "manager_all"  ON leads      FOR ALL    USING (is_manager_or_admin());
CREATE POLICY "manager_all"  ON sales      FOR ALL    USING (is_manager_or_admin());

-- Operator: apenas suas próprias produções, leads atribuídos e notificações
CREATE POLICY "operator_productions" ON productions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE email = (auth.jwt() ->> 'email') AND role = 'operator' AND active = true)
    AND assigned_to = (SELECT id FROM public.users WHERE email = (auth.jwt() ->> 'email'))
  );

CREATE POLICY "operator_leads" ON leads
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE email = (auth.jwt() ->> 'email') AND role = 'operator' AND active = true)
    AND assigned_to = (SELECT id FROM public.users WHERE email = (auth.jwt() ->> 'email'))
  );

CREATE POLICY "operator_notifications" ON notifications
  FOR ALL USING (
    user_id = (SELECT id FROM public.users WHERE email = (auth.jwt() ->> 'email')) OR user_id IS NULL
  );

COMMIT;
