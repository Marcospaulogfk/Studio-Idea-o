# Studio Ideação — CRM · ERP · BI

Sistema integrado de gestão para o Studio Ideação.

## Stack
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Deploy**: Vercel

## Setup

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
Copie `.env.example` para `.env.local` e preencha com suas credenciais do Supabase.

### 3. Aplicar o banco de dados
Acesse o [SQL Editor do Supabase](https://supabase.com/dashboard/project/_/sql), cole o conteúdo de `supabase/schema.sql` e execute.

### 4. Rodar localmente
```bash
npm run dev
```

Acesse: http://localhost:3000

## Módulos
1. Dashboard BI — KPIs em tempo real
2. Leads — Pipeline Kanban CRM
3. Clientes — Master data com LTV
4. Vendas — Central de receitas
5. Pacotes — Controle de artes com vencimento de 60 dias
6. Produção — Kanban de produção
7. Financeiro — Contas a pagar e receber
8. Pós-venda — NPS e upsell

## Deploy (Vercel)
1. Conecte o repositório GitHub na Vercel
2. Configure as variáveis de ambiente no painel da Vercel
3. Deploy automático a cada push na branch `main`
