-- ============================================================
-- FINANCIALS — suporte a contas recorrentes
-- ============================================================
-- Adiciona recurrence (none/weekly/monthly/yearly) e um trigger
-- que cria automaticamente a proxima ocorrencia quando uma
-- conta recorrente é marcada como paga.
--
-- Idempotente — pode ser re-rodado.
-- ============================================================

BEGIN;

-- 1. Coluna nova (default 'none' para nao quebrar registros antigos)
ALTER TABLE financials
  ADD COLUMN IF NOT EXISTS recurrence TEXT DEFAULT 'none'
  CHECK (recurrence IN ('none','weekly','monthly','yearly'));

-- Coluna para rastrear de qual conta recorrente o registro foi gerado
ALTER TABLE financials
  ADD COLUMN IF NOT EXISTS recurrence_parent_id UUID REFERENCES financials(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_financials_recurrence ON financials(recurrence) WHERE recurrence <> 'none';
CREATE INDEX IF NOT EXISTS idx_financials_parent ON financials(recurrence_parent_id);

-- 2. Trigger: quando uma conta recorrente é marcada como paga,
--    gera a proxima ocorrencia automaticamente com a data ajustada.
CREATE OR REPLACE FUNCTION public.spawn_next_recurrence() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_due DATE;
  v_already_exists BOOLEAN;
BEGIN
  -- só dispara quando vira paid (passou de qualquer status -> paid)
  IF NEW.status <> 'paid' OR OLD.status = 'paid' THEN
    RETURN NEW;
  END IF;

  -- só cria proxima se for recorrente
  IF NEW.recurrence IS NULL OR NEW.recurrence = 'none' THEN
    RETURN NEW;
  END IF;

  -- calcula proxima data baseado na due_date (se vazia, usa hoje)
  v_next_due := COALESCE(NEW.due_date, CURRENT_DATE);
  CASE NEW.recurrence
    WHEN 'weekly'  THEN v_next_due := v_next_due + INTERVAL '7 days';
    WHEN 'monthly' THEN v_next_due := v_next_due + INTERVAL '1 month';
    WHEN 'yearly'  THEN v_next_due := v_next_due + INTERVAL '1 year';
  END CASE;

  -- evita duplicar se ja foi gerada (pelo parent_id + due_date)
  SELECT EXISTS(
    SELECT 1 FROM financials
    WHERE recurrence_parent_id = NEW.id
      AND due_date = v_next_due
  ) INTO v_already_exists;

  IF v_already_exists THEN
    RETURN NEW;
  END IF;

  -- cria a proxima ocorrencia (status pending, paid_at null)
  INSERT INTO financials (
    type, sale_id, description, amount, category, due_date,
    payment_method, status, recurrence, recurrence_parent_id
  )
  VALUES (
    NEW.type, NEW.sale_id, NEW.description, NEW.amount, NEW.category, v_next_due,
    NEW.payment_method, 'pending', NEW.recurrence, NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_spawn_next_recurrence ON financials;
CREATE TRIGGER trg_spawn_next_recurrence
  AFTER UPDATE ON financials
  FOR EACH ROW EXECUTE FUNCTION public.spawn_next_recurrence();

COMMIT;
