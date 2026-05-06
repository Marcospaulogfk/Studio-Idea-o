-- ============================================================
-- AMPLIAÇÃO DE RLS PARA O CARGO 'OPERATOR'
-- ============================================================
-- Após aplicar role-rls-hardening.sql, este script libera para o
-- operador o acesso a clientes, leads, vendas, pacotes, produções
-- e pós-vendas. Continua bloqueando financial, users e audit_logs
-- (apenas admin/manager para financial; admin para users/audit).
--
-- Idempotente — pode ser re-rodado.
-- ============================================================

BEGIN;

-- helper: qualquer authenticated com active=true
CREATE OR REPLACE FUNCTION public.is_authenticated_user() RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public
AS $$
DECLARE v_email TEXT;
BEGIN
  v_email := auth.jwt() ->> 'email';
  IF v_email IS NULL THEN RETURN FALSE; END IF;
  RETURN EXISTS (SELECT 1 FROM public.users WHERE email = v_email AND active = true);
END;
$$;

-- ============================================================
-- CLIENTS — leitura geral, escrita só admin/manager
-- ============================================================
DROP POLICY IF EXISTS "operator_read"   ON clients;
DROP POLICY IF EXISTS "operator_leads_read" ON leads;
DROP POLICY IF EXISTS "operator_sales_read" ON sales;
DROP POLICY IF EXISTS "operator_packages_all" ON packages;
DROP POLICY IF EXISTS "operator_aftersales_read" ON aftersales;
DROP POLICY IF EXISTS "operator_followups_all" ON followups;
DROP POLICY IF EXISTS "operator_leads" ON leads;
DROP POLICY IF EXISTS "operator_productions" ON productions;

CREATE POLICY "operator_read" ON clients
  FOR SELECT USING (is_authenticated_user());

-- ============================================================
-- LEADS — operator vê todos (não só assigned), pode editar
-- ============================================================
CREATE POLICY "operator_leads_all" ON leads
  FOR ALL USING (is_authenticated_user());

-- ============================================================
-- SALES — operator vê todas, mas só admin/manager registra/edita
-- ============================================================
CREATE POLICY "operator_sales_read" ON sales
  FOR SELECT USING (is_authenticated_user());

-- ============================================================
-- PACKAGES — operator vê e atualiza arts_used
-- ============================================================
CREATE POLICY "operator_packages_all" ON packages
  FOR ALL USING (is_authenticated_user());

-- ============================================================
-- PRODUCTIONS — operator vê e edita TUDO (não só atribuídas)
-- ============================================================
CREATE POLICY "operator_productions_all" ON productions
  FOR ALL USING (is_authenticated_user());

-- ============================================================
-- AFTERSALES — operator vê e edita
-- ============================================================
CREATE POLICY "operator_aftersales_all" ON aftersales
  FOR ALL USING (is_authenticated_user());

-- ============================================================
-- FOLLOWUPS — operator pode registrar
-- ============================================================
CREATE POLICY "operator_followups_all" ON followups
  FOR ALL USING (is_authenticated_user());

-- ============================================================
-- NOTIFICATIONS — substitui policy antiga por uma mais ampla:
-- vê notificações sem dono OU notificações relacionadas a
-- entidades que ele tocou (leads/produções/sales onde aparece em
-- audit_logs)
-- ============================================================
DROP POLICY IF EXISTS "operator_notifications" ON notifications;
DROP POLICY IF EXISTS "operator_notifications_v2" ON notifications;
CREATE POLICY "operator_notifications_v2" ON notifications
  FOR ALL USING (
    is_authenticated_user() AND (
      user_id IS NULL
      OR user_id = (SELECT id FROM public.users WHERE email = (auth.jwt() ->> 'email'))
      OR EXISTS (
        SELECT 1 FROM public.audit_logs a
        WHERE a.row_id = notifications.entity_id
          AND a.changed_email = (auth.jwt() ->> 'email')
      )
    )
  );

-- ============================================================
-- FILE_ASSETS — operator pode adicionar/ler arquivos de produção
-- ============================================================
DROP POLICY IF EXISTS "operator_files_all" ON file_assets;
CREATE POLICY "operator_files_all" ON file_assets
  FOR ALL USING (is_authenticated_user());

COMMIT;
