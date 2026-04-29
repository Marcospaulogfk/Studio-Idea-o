import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, KpiCard, CircularProgress, Badge } from '@/components/ui'
import { ServicesPieChart } from '@/components/modules/dashboard/ServicesPieChart'
import { OriginBarChart } from '@/components/modules/dashboard/OriginBarChart'
import { formatCurrency } from '@/lib/utils'
import { Users, Package, UserPlus, ShoppingBag, PieChart, BarChart3, Target } from 'lucide-react'

const MONTHLY_GOAL = 30000 // R$ 30.000 — meta de faturamento mensal

export default async function DashboardPage() {
  const supabase = createClient()

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const [
    { count: leadsCount },
    { count: clientsCount },
    { count: salesCount },
    { count: packagesCount },
    { data: recentSales },
    { data: recentLeads },
    { data: salesThisMonth },
    { data: salesAll },
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('sales').select('*', { count: 'exact', head: true }),
    supabase.from('packages').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('sales').select('id, total_value, services, sold_at, client:clients(name)').order('sold_at', { ascending: false }).limit(5),
    supabase.from('leads').select('id, name, funnel_stage, service, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('sales').select('total_value, origin, services').gte('sold_at', monthStart.toISOString()),
    supabase.from('sales').select('total_value, origin, services'),
  ])

  // Receita do mês (Goals)
  const monthRevenue = (salesThisMonth ?? []).reduce((s, x: any) => s + Number(x.total_value || 0), 0)

  // Top serviços (UNNEST de sales.services)
  const serviceCounts = new Map<string, number>()
  ;(salesAll ?? []).forEach((s: any) => {
    ;(s.services ?? []).forEach((svc: string) => {
      serviceCounts.set(svc, (serviceCounts.get(svc) ?? 0) + 1)
    })
  })
  const topServices = Array.from(serviceCounts.entries())
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count)

  // Receita por origem (mês atual)
  const originRevenue = new Map<string, number>()
  ;(salesThisMonth ?? []).forEach((s: any) => {
    const o = s.origin ?? 'other'
    originRevenue.set(o, (originRevenue.get(o) ?? 0) + Number(s.total_value || 0))
  })
  const originData = Array.from(originRevenue.entries()).map(([origin, total_revenue]) => ({ origin, total_revenue }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Visão geral do Studio Ideação</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total de Leads" value={String(leadsCount ?? 0)}    icon={<UserPlus size={20}/>}    color="blue"/>
        <KpiCard title="Clientes"        value={String(clientsCount ?? 0)}  icon={<Users size={20}/>}       color="green"/>
        <KpiCard title="Vendas"          value={String(salesCount ?? 0)}    icon={<ShoppingBag size={20}/>} color="purple"/>
        <KpiCard title="Pacotes Ativos"  value={String(packagesCount ?? 0)} icon={<Package size={20}/>}     color="orange"/>
      </div>

      {/* Charts row — 3 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader
            title="Serviços mais vendidos"
            subtitle="Top 6 do histórico"
            action={<PieChart size={18} className="text-gray-300 dark:text-slate-600"/>}
          />
          <ServicesPieChart data={topServices} />
        </Card>

        <Card>
          <CardHeader
            title="Receita por canal"
            subtitle="Mês atual"
            action={<BarChart3 size={18} className="text-gray-300 dark:text-slate-600"/>}
          />
          <OriginBarChart data={originData} />
        </Card>

        <Card>
          <CardHeader
            title="Meta do mês"
            subtitle={formatCurrency(MONTHLY_GOAL)}
            action={<Target size={18} className="text-gray-300 dark:text-slate-600"/>}
          />
          <div className="flex flex-col items-center gap-4 py-2">
            <CircularProgress value={monthRevenue} max={MONTHLY_GOAL} size={150} label="da meta" />
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{formatCurrency(monthRevenue)}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Faltam <span className="font-semibold text-orange-600 dark:text-orange-400">{formatCurrency(Math.max(0, MONTHLY_GOAL - monthRevenue))}</span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Listas: últimas vendas + leads recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Últimas Vendas" subtitle="5 mais recentes" />
          {recentSales && recentSales.length > 0 ? (
            <div className="space-y-1">
              {recentSales.map((sale: any) => (
                <div key={sale.id} className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-lg hover:bg-orange-500/5 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">{sale.client?.name ?? '—'}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{sale.services?.slice(0,2).join(', ')}</p>
                  </div>
                  <p className="text-sm font-bold text-green-600 dark:text-green-400 ml-3 shrink-0">{formatCurrency(sale.total_value)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Nenhuma venda ainda!</p>
          )}
        </Card>

        <Card>
          <CardHeader title="Leads Recentes" subtitle="5 mais novos" />
          {recentLeads && recentLeads.length > 0 ? (
            <div className="space-y-1">
              {recentLeads.map((lead: any) => (
                <div key={lead.id} className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-lg hover:bg-orange-500/5 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">{lead.name}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{lead.service ?? 'Sem serviço'}</p>
                  </div>
                  <Badge variant={
                    lead.funnel_stage === 'closed' ? 'green' :
                    lead.funnel_stage === 'negotiating' ? 'yellow' :
                    lead.funnel_stage === 'new' ? 'blue' : 'gray'
                  } className="ml-3 shrink-0">
                    {lead.funnel_stage === 'new' ? 'Novo'
                      : lead.funnel_stage === 'negotiating' ? 'Em Negociação'
                      : lead.funnel_stage === 'closed' ? 'Fechado'
                      : lead.funnel_stage}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Nenhum lead ainda!</p>
          )}
        </Card>
      </div>
    </div>
  )
}
