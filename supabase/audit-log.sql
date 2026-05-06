-- ============================================================
-- AUDIT LOG — registro automático de mudanças críticas
-- ============================================================
-- Cria tabela de logs + função de trigger genérica que captura
-- INSERT/UPDATE/DELETE em entidades sensíveis (leads, sales,
-- clients, financials, users, packages, productions).
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name  TEXT NOT NULL,
  row_id      UUID,
  action      TEXT NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  old_data    JSONB,
  new_data    JSONB,
  changed_by  UUID,
  changed_email TEXT,
  changed_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_row ON audit_logs (table_name, row_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON audit_logs (changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by ON audit_logs (changed_by);

-- ============================================================
-- Função genérica de trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.audit_trigger() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_user_id UUID;
  v_row_id UUID;
BEGIN
  v_email := COALESCE(auth.jwt() ->> 'email', NULL);
  IF v_email IS NOT NULL THEN
    SELECT id INTO v_user_id FROM public.users WHERE email = v_email LIMIT 1;
  END IF;

  IF (TG_OP = 'DELETE') THEN
    v_row_id := (OLD).id;
    INSERT INTO audit_logs (table_name, row_id, action, old_data, changed_by, changed_email)
    VALUES (TG_TABLE_NAME, v_row_id, 'DELETE', to_jsonb(OLD), v_user_id, v_email);
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    v_row_id := (NEW).id;
    -- Só registra se algo de fato mudou (evita ruído)
    IF to_jsonb(NEW) <> to_jsonb(OLD) THEN
      INSERT INTO audit_logs (table_name, row_id, action, old_data, new_data, changed_by, changed_email)
      VALUES (TG_TABLE_NAME, v_row_id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), v_user_id, v_email);
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    v_row_id := (NEW).id;
    INSERT INTO audit_logs (table_name, row_id, action, new_data, changed_by, changed_email)
    VALUES (TG_TABLE_NAME, v_row_id, 'INSERT', to_jsonb(NEW), v_user_id, v_email);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- ============================================================
-- Anexa o trigger nas tabelas sensíveis
-- ============================================================
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['leads','clients','sales','financials','users','packages','productions']) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%I ON %I', t, t);
    EXECUTE format(
      'CREATE TRIGGER audit_%I AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION public.audit_trigger()',
      t, t
    );
  END LOOP;
END $$;

-- ============================================================
-- RLS: somente admin pode ler audit_logs
-- ============================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_admin_read" ON audit_logs;
CREATE POLICY "audit_admin_read" ON audit_logs FOR SELECT USING (is_admin());

COMMIT;
