# Studio Ideação — CRM · ERP · BI

Sistema integrado de gestão (CRM + ERP + Business Intelligence) construído sob medida para o Studio Ideação.

## Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Recharts, dnd-kit
- **Backend**: Supabase (PostgreSQL · Auth · Realtime · Storage)
- **Deploy**: Vercel

## Setup local

```bash
# 1. Instalar deps
npm install

# 2. Variáveis de ambiente
cp .env.example .env.local
# preencher NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY e NEXT_PUBLIC_APP_URL

# 3. Subir banco
# Cole no SQL Editor do Supabase, na ordem:
#   supabase/schema.sql
#   supabase/role-rls-hardening.sql
#   supabase/operator-rls-expand.sql
#   supabase/audit-log.sql
#   supabase/add-leads-position.sql

# 4. Dev
npm run dev   # http://localhost:3000
```

### Variáveis de ambiente

| Var | Onde pegar | Obrigatória |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase → Settings → API | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase → Settings → API (manter privado) | ✅ |
| `NEXT_PUBLIC_APP_URL`           | URL pública do app | ✅ |

> O service role key **nunca** vai pro browser. Só é importado em rotas server-side (`/api/*`) e Server Components.

## Cargos e permissões

| Recurso     | admin | manager | operator |
|---|---|---|---|
| Dashboard   | ✅ | ✅ | ✅ |
| Leads       | ✅ | ✅ | ✅ leitura/edição |
| Clientes    | ✅ | ✅ | ✅ leitura |
| Vendas      | ✅ | ✅ | ✅ leitura |
| Pacotes     | ✅ | ✅ | ✅ |
| Produção    | ✅ | ✅ | ✅ |
| Pós-Venda   | ✅ | ✅ | ✅ |
| Financeiro  | ✅ | ✅ | ❌ |
| Equipe      | ✅ | ✅ (só não cria admin) | ❌ |
| Auditoria   | ✅ | ❌ | ❌ |
| Editar próprio perfil | ✅ | ✅ | ✅ |

## Convidar colaborador

Não há cadastro público. Em **Equipe → Adicionar Colaborador**:

1. Admin/manager preenche nome, e-mail e cargo
2. Sistema dispara convite via Supabase Auth (`inviteUserByEmail`)
3. Colaborador recebe e-mail com link → define a senha → entra direto

> Pra o e-mail efetivamente sair, configure SMTP em **Supabase → Auth → Settings → SMTP** (Resend / SendGrid / Postmark recomendados).

## Estrutura

```
src/
  app/
    (auth-public)        — login, reset-password, update-password, callback
    api/                 — rotas server (team, auth/me, profile)
    audit/               — auditoria (admin)
    team/                — equipe (admin/manager)
    profile/             — perfil próprio
    [demais módulos]
  components/
    layout/              — Sidebar, DashboardShell
    modules/             — UI específica de cada módulo
    ui/                  — Button, Card, KpiCard, Input, MoneyInput, DateRangeFilter…
  lib/
    auth.ts              — getCurrentProfile, requireRole
    csv.ts               — exportação CSV
    supabase/            — clients (browser/server/admin)
    utils.ts             — formatadores, validadores, máscaras
supabase/
  schema.sql                   — tabelas, views, triggers, pg_cron
  role-rls-hardening.sql       — RLS role-based
  operator-rls-expand.sql      — leitura ampla pra operator
  audit-log.sql                — tabela + triggers de auditoria
  add-leads-position.sql       — coluna position pro kanban
```

## Recursos

- 🔐 **Auth + RLS role-based** (admin / manager / operator)
- 📋 **Convite por e-mail** + reset de senha
- 🌗 **Dark mode** persistido por usuário
- 📱 **Mobile-first** (drawer + topbar)
- 🔔 **Notificações realtime** via Supabase channels
- 📊 **Dashboard BI** com gráficos de pizza/barras
- 🗃️ **Kanban DnD** em Leads e Produção
- 💸 **LTV automático** via trigger
- 📥 **Exportação CSV** (vendas, financeiro, leads, clientes)
- 📅 **Filtros de período** (mês, custom range)
- 📜 **Audit log** com diff antes/depois
- 🤖 **Cron jobs** Postgres (pacotes vencendo, follow-up atrasado)

## Manutenção

### Promover/remover colaborador
1. Login como admin
2. **Equipe** → seletor de cargo na linha do colaborador
3. Para revogar acesso, clicar em **Power** (desativa + bane no auth)

### Reaplicar SQL após mudança de schema
Os arquivos em `supabase/*.sql` são **idempotentes** — pode rodar de novo sem quebrar.

### Backups
Supabase já faz backup diário automático. Para restore, use o painel do projeto.

### Logs de produção
- App: Vercel → Project → Logs
- Banco: Supabase → Logs Explorer → `postgres-logs`

## Deploy (Vercel)

1. Conecte o repo GitHub
2. Configure as 4 variáveis de ambiente
3. **Importante**: em Supabase → Auth → URL Configuration, adicione:
   - **Site URL**: `https://seudominio.com`
   - **Redirect URLs**: `https://seudominio.com/auth/callback`
4. Push em `main` → deploy automático

## Stack mínima vs prod

- **Free tier Supabase** suporta até ~500MB DB e 4 e-mails/h (default SMTP). Pra prod, plug Resend/SendGrid.
- **Vercel Hobby** atende — só vire Pro se for ter mais que 100GB de bandwidth/mês.

## Suporte

Issues: https://github.com/Marcospaulogfk/Studio-Idea-o/issues
