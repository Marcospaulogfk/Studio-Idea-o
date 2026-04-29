-- ============================================================
-- ECOSSISTEMA STUDIO IDEAÇÃO — Schema Completo PostgreSQL
-- Supabase: hxfqiulgkoqpwczjxkcz
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ============================================================
-- TABELA: users (perfis de usuário)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin','manager','operator')),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: clients (master data de clientes)
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  cpf_cnpj TEXT,
  address TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
  ltv NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: leads (pipeline CRM)
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  service TEXT,
  estimated_value NUMERIC(12,2),
  origin TEXT CHECK (origin IN ('instagram','web','referral','paid_traffic','whatsapp','other')),
  funnel_stage TEXT DEFAULT 'new' CHECK (funnel_stage IN ('new','negotiating','closed','disqualified','future')),
  notes TEXT,
  assigned_to UUID REFERENCES users(id),
  last_contact TIMESTAMPTZ,
  next_followup TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: followups (histórico de follow-up)
-- ============================================================
CREATE TABLE IF NOT EXISTS followups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  contacted_at TIMESTAMPTZ DEFAULT NOW(),
  next_followup TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: sales (vendas realizadas)
-- ============================================================
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  lead_id UUID REFERENCES leads(id),
  services TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  total_value NUMERIC(12,2) NOT NULL,
  origin TEXT CHECK (origin IN ('instagram','web','referral','paid_traffic','whatsapp','other')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','50%','100%')),
  client_type TEXT DEFAULT 'new' CHECK (client_type IN ('new','returning')),
  paid_traffic BOOLEAN DEFAULT FALSE,
  sold_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: packages (pacotes de artes)
-- ============================================================
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id),
  model TEXT DEFAULT 'custom' CHECK (model IN ('5','10','20','custom')),
  arts_total INTEGER NOT NULL,
  arts_used INTEGER DEFAULT 0,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: productions (kanban de produção)
-- ============================================================
CREATE TABLE IF NOT EXISTS productions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES sales(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  title TEXT,
  status TEXT DEFAULT 'queue' CHECK (status IN ('queue','in_progress','done')),
  queue_position INTEGER DEFAULT 0,
  assigned_to UUID REFERENCES users(id),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: file_assets (metadados de arquivos na VPN/Storage)
-- ============================================================
CREATE TABLE IF NOT EXISTS file_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  production_id UUID REFERENCES productions(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES sales(id),
  client_id UUID REFERENCES clients(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  uploaded_by UUID REFERENCES users(id),
  storage_provider TEXT DEFAULT 'supabase' CHECK (storage_provider IN ('supabase','vpn')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: financials (contas a pagar e receber)
-- ============================================================
CREATE TABLE IF NOT EXISTS financials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('receivable','payable')),
  sale_id UUID REFERENCES sales(id),
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  category TEXT DEFAULT 'other' CHECK (category IN ('personal','tools','marketing','rent','taxes','ads','other')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  payment_method TEXT CHECK (payment_method IN ('pix','ted','boleto','cash','card','other')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: aftersales (pós-venda)
-- ============================================================
CREATE TABLE IF NOT EXISTS aftersales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  sale_id UUID NOT NULL REFERENCES sales(id),
  production_id UUID REFERENCES productions(id),
  nps_score INTEGER CHECK (nps_score BETWEEN 1 AND 5),
  feedback TEXT,
  upsell_interest TEXT[],
  next_contact DATE,
  contacted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: notifications (alertas do sistema)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('followup_overdue','package_expiring_15','package_expiring_7','package_expired','sale_pending_payment','production_done')),
  title TEXT NOT NULL,
  message TEXT,
  entity_id UUID,
  entity_type TEXT,
  read BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VIEWS: BI e relatórios
-- ============================================================

-- LTV calculado por cliente
CREATE OR REPLACE VIEW client_ltv AS
SELECT
  c.id,
  c.name,
  COALESCE(SUM(s.total_value), 0) AS ltv,
  COUNT(s.id) AS total_sales
FROM clients c
LEFT JOIN sales s ON s.client_id = c.id
GROUP BY c.id, c.name;

-- Dashboard KPIs — mês atual
CREATE OR REPLACE VIEW dashboard_kpis AS
SELECT
  -- Leads
  COUNT(DISTINCT l.id) FILTER (WHERE DATE_TRUNC('month', l.created_at) = DATE_TRUNC('month', NOW())) AS leads_this_month,
  COUNT(DISTINCT l.id) FILTER (WHERE l.funnel_stage = 'closed' AND DATE_TRUNC('month', l.created_at) = DATE_TRUNC('month', NOW())) AS leads_closed_month,
  ROUND(
    COUNT(DISTINCT l.id) FILTER (WHERE l.funnel_stage = 'closed' AND DATE_TRUNC('month', l.created_at) = DATE_TRUNC('month', NOW()))::NUMERIC /
    NULLIF(COUNT(DISTINCT l.id) FILTER (WHERE DATE_TRUNC('month', l.created_at) = DATE_TRUNC('month', NOW())), 0) * 100, 1
  ) AS conversion_rate,
  -- Vendas
  COALESCE(SUM(s.total_value) FILTER (WHERE DATE_TRUNC('month', s.sold_at) = DATE_TRUNC('month', NOW())), 0) AS revenue_this_month,
  COALESCE(AVG(s.total_value) FILTER (WHERE DATE_TRUNC('month', s.sold_at) = DATE_TRUNC('month', NOW())), 0) AS avg_ticket,
  COALESCE(SUM(s.total_value) FILTER (WHERE s.payment_status = '100%' AND DATE_TRUNC('month', s.sold_at) = DATE_TRUNC('month', NOW())), 0) AS received_this_month,
  COALESCE(SUM(s.total_value * 0.5) FILTER (WHERE s.payment_status = '50%'), 0) AS total_receivable,
  -- Recorrência
  COALESCE(SUM(s.total_value) FILTER (WHERE s.client_type = 'returning' AND DATE_TRUNC('month', s.sold_at) = DATE_TRUNC('month', NOW())), 0) AS returning_revenue,
  -- Pacotes
  COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'active') AS active_packages,
  COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'active' AND p.expires_at <= NOW() + INTERVAL '15 days') AS expiring_packages
FROM leads l
FULL OUTER JOIN sales s ON TRUE
FULL OUTER JOIN packages p ON TRUE;

-- ROI por origem
CREATE OR REPLACE VIEW roi_by_origin AS
SELECT
  origin,
  COUNT(*) AS total_sales,
  SUM(total_value) AS total_revenue,
  AVG(total_value) AS avg_ticket
FROM sales
WHERE DATE_TRUNC('month', sold_at) = DATE_TRUNC('month', NOW())
GROUP BY origin
ORDER BY total_revenue DESC;

-- Serviço mais vendido
CREATE OR REPLACE VIEW top_services AS
SELECT
  UNNEST(services) AS service,
  COUNT(*) AS count,
  SUM(total_value) AS total_revenue
FROM sales
GROUP BY service
ORDER BY count DESC;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- 1. Trigger: expires_at automático em packages (sold_at + 60 dias)
CREATE OR REPLACE FUNCTION set_package_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NEW.activated_at + INTERVAL '60 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_package_expiry ON packages;
CREATE TRIGGER trg_package_expiry
  BEFORE INSERT ON packages
  FOR EACH ROW EXECUTE FUNCTION set_package_expiry();

-- 2. Trigger: atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_clients_updated ON clients;
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_leads_updated ON leads;
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_sales_updated ON sales;
CREATE TRIGGER trg_sales_updated BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_packages_updated ON packages;
CREATE TRIGGER trg_packages_updated BEFORE UPDATE ON packages FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_productions_updated ON productions;
CREATE TRIGGER trg_productions_updated BEFORE UPDATE ON productions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. Trigger: lead fechado → cria venda + abre produção
CREATE OR REPLACE FUNCTION on_lead_closed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.funnel_stage = 'closed' AND OLD.funnel_stage != 'closed' THEN
    NEW.converted_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lead_closed ON leads;
CREATE TRIGGER trg_lead_closed
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION on_lead_closed();

-- 4. Trigger: venda criada com 50% → lança financeiro receivable
CREATE OR REPLACE FUNCTION on_sale_created()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = '50%' THEN
    INSERT INTO financials (type, sale_id, description, amount, category, status)
    VALUES ('receivable', NEW.id, 'Saldo pendente — ' || (SELECT name FROM clients WHERE id = NEW.client_id), NEW.total_value * 0.5, 'other', 'pending');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sale_created ON sales;
CREATE TRIGGER trg_sale_created
  AFTER INSERT ON sales
  FOR EACH ROW EXECUTE FUNCTION on_sale_created();

-- 5. Trigger: atualizar LTV do cliente quando venda é inserida/atualizada
CREATE OR REPLACE FUNCTION update_client_ltv()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE clients
  SET ltv = (SELECT COALESCE(SUM(total_value), 0) FROM sales WHERE client_id = NEW.client_id)
  WHERE id = NEW.client_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_ltv ON sales;
CREATE TRIGGER trg_update_ltv
  AFTER INSERT OR UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_client_ltv();

-- 6. Trigger: produção finalizada → cria pós-venda
CREATE OR REPLACE FUNCTION on_production_done()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    NEW.finished_at := NOW();
    INSERT INTO aftersales (client_id, sale_id, production_id)
    VALUES (NEW.client_id, NEW.sale_id, NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_production_done ON productions;
CREATE TRIGGER trg_production_done
  BEFORE UPDATE ON productions
  FOR EACH ROW EXECUTE FUNCTION on_production_done();

-- 7. Trigger: package criado → cria notificação inicial
CREATE OR REPLACE FUNCTION on_package_inserted()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (type, title, message, entity_id, entity_type)
  VALUES ('package_expiring_15', 'Pacote ativado', 'Pacote vence em ' || TO_CHAR(NEW.expires_at, 'DD/MM/YYYY'), NEW.id, 'package');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_package_inserted ON packages;
CREATE TRIGGER trg_package_inserted
  AFTER INSERT ON packages
  FOR EACH ROW EXECUTE FUNCTION on_package_inserted();

-- ============================================================
-- pg_cron JOBS (rodam diariamente às 08h)
-- ============================================================

-- Job 1: leads sem contato há 7 dias → mover para 'future'
SELECT cron.schedule(
  'daily_followup_check',
  '0 8 * * *',
  $$
    UPDATE leads
    SET funnel_stage = 'future', updated_at = NOW()
    WHERE funnel_stage IN ('new','negotiating')
      AND (last_contact IS NULL OR last_contact < NOW() - INTERVAL '7 days')
      AND funnel_stage != 'closed'
      AND funnel_stage != 'disqualified';

    INSERT INTO notifications (type, title, message, entity_id, entity_type)
    SELECT 'followup_overdue', 'Follow-up vencido', 'Lead ' || name || ' sem contato há mais de 3 dias', id, 'lead'
    FROM leads
    WHERE funnel_stage IN ('new','negotiating')
      AND last_contact < NOW() - INTERVAL '3 days'
      AND last_contact >= NOW() - INTERVAL '7 days';
  $$
);

-- Job 2: pacotes expirando em 15 e 7 dias → notificações
SELECT cron.schedule(
  'package_expiry_check',
  '0 8 * * *',
  $$
    -- Alerta 15 dias
    INSERT INTO notifications (type, title, message, entity_id, entity_type)
    SELECT 'package_expiring_15', 'Pacote vence em 15 dias',
           'Cliente: ' || (SELECT name FROM clients WHERE id = p.client_id) || ' — vence em ' || TO_CHAR(p.expires_at, 'DD/MM/YYYY'),
           p.id, 'package'
    FROM packages p
    WHERE p.status = 'active'
      AND p.expires_at::DATE = (NOW() + INTERVAL '15 days')::DATE;

    -- Alerta 7 dias
    INSERT INTO notifications (type, title, message, entity_id, entity_type)
    SELECT 'package_expiring_7', 'URGENTE — Pacote vence em 7 dias',
           'Cliente: ' || (SELECT name FROM clients WHERE id = p.client_id) || ' — vence em ' || TO_CHAR(p.expires_at, 'DD/MM/YYYY'),
           p.id, 'package'
    FROM packages p
    WHERE p.status = 'active'
      AND p.expires_at::DATE = (NOW() + INTERVAL '7 days')::DATE;

    -- Marcar expirados
    UPDATE packages SET status = 'expired', updated_at = NOW()
    WHERE status = 'active' AND expires_at < NOW();
  $$
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE clients     ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads       ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups   ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales       ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financials  ENABLE ROW LEVEL SECURITY;
ALTER TABLE aftersales  ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE users       ENABLE ROW LEVEL SECURITY;

-- Admin: acesso total
CREATE POLICY "admin_all" ON clients       FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "admin_all" ON leads         FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "admin_all" ON followups     FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "admin_all" ON sales         FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "admin_all" ON packages      FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "admin_all" ON productions   FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "admin_all" ON financials    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "admin_all" ON aftersales    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "admin_all" ON file_assets   FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "admin_all" ON notifications FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "admin_all" ON users         FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Manager: acesso a tudo exceto financeiro completo
CREATE POLICY "manager_read" ON financials FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin','manager'));
CREATE POLICY "manager_all"  ON clients    FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','manager'));
CREATE POLICY "manager_all"  ON leads      FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','manager'));
CREATE POLICY "manager_all"  ON sales      FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','manager'));

-- Operator: apenas produção e leads atribuídos
CREATE POLICY "operator_productions" ON productions
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'operator' AND
    assigned_to = (auth.jwt() ->> 'sub')::UUID
  );

CREATE POLICY "operator_leads" ON leads
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'operator' AND
    assigned_to = (auth.jwt() ->> 'sub')::UUID
  );

CREATE POLICY "operator_notifications" ON notifications
  FOR ALL USING (
    user_id = (auth.jwt() ->> 'sub')::UUID OR user_id IS NULL
  );

-- ============================================================
-- SEED: usuário admin inicial
-- ============================================================
INSERT INTO users (email, name, role)
VALUES ('sucheskiempresa@gmail.com', 'Jonathan Sucheski', 'admin')
ON CONFLICT (email) DO NOTHING;

