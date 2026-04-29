-- ============================================================
-- Adiciona coluna `position` em leads para reorder no kanban
-- ============================================================
-- Backfill: posições sequenciais por estágio, mais novos no topo.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;

WITH ranked AS (
  SELECT id,
         (ROW_NUMBER() OVER (PARTITION BY funnel_stage ORDER BY created_at DESC) - 1)::INTEGER AS new_pos
  FROM leads
)
UPDATE leads
SET position = ranked.new_pos
FROM ranked
WHERE leads.id = ranked.id;

CREATE INDEX IF NOT EXISTS idx_leads_stage_position ON leads (funnel_stage, position);
