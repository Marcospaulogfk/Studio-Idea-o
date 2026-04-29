-- ============================================================
-- FIX: substituir policies baseadas em JWT-role por permissivas
-- ============================================================
-- O schema original checa `auth.jwt() ->> 'role' = 'admin'`, mas
-- JWTs do Supabase Auth carregam role='authenticated' (do Postgres),
-- nunca 'admin'. Por isso TODAS as queries são bloqueadas.
--
-- Esta migração troca por: qualquer authenticated tem acesso total.
-- Adequado pra fase single-admin/demo. RLS continua ligado para anon.
--
-- Quando adicionar manager/operator, refatore as policies para usar
-- uma função SECURITY DEFINER `is_admin()` que faz lookup em
-- public.users por email do JWT.
-- ============================================================

BEGIN;

-- 1. Remove policies antigas
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

-- 2. Policies permissivas: authenticated tem acesso total
CREATE POLICY "auth_all" ON clients       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON leads         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON followups     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON sales         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON packages      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON productions   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON financials    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON aftersales    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON file_assets   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON users         FOR ALL TO authenticated USING (true) WITH CHECK (true);

COMMIT;
