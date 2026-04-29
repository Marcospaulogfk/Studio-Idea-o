import { createClient } from '@/lib/supabase/server'
import { Card, KpiCard } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { Users, Package, UserPlus, ShoppingBag } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createClient()

  const [
    { count: leadsCount },
    { count: clientsCount },
    { count: salesCount },
    { count: packagesCount },
    { data: recentSales },
    { data: recentLeads },
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('sales').select('*', { count: 'exact', head: true }),
    supabase.from('packages').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('sales').select('id, total_value, services, client:clients(name)').order('sold_at', { ascending: false }).limit(5),
    supabase.from('leads').select('id, name, funnel_stage, service').order('created_at', { ascending: false }).limit(5),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Bem-vindo ao Studio Ideação 🎉</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total de Leads" value={String(leadsCount ?? 0)} icon={<UserPlus size={20}/>} color="blue"/>
        <KpiCard title="Clientes" value={String(clientsCount ?? 0)} icon={<Users size={20}/>} color="green"/>
        <KpiCard title="Vendas" value={String(salesCount ?? 0)} icon={<ShoppingBag size={20}/>} color="purple"/>
        <KpiCard title="Pacotes Ativos" value={String(packagesCount ?? 0)} icon={<Package size={20}/>} color="yellow"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Últimas Vendas</h3>
          {recentSales && recentSales.length > 0 ? (
            <div className="space-y-3">
              {recentSales.map((sale: any) => (
                <div key={sale.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{sale.client?.name ?? '—'}</p>
                    <p className="text-xs text-gray-500">{sale.services?.slice(0,2).join(', ')}</p>
                  </div>
                  <p className="text-sm font-bold text-green-700">{formatCurrency(sale.total_value)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Nenhuma venda ainda!</p>
          )}
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Leads Recentes</h3>
          {recentLeads && recentLeads.length > 0 ? (
            <div className="space-y-3">
              {recentLeads.map((lead: any) => (
                <div key={lead.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{lead.name}</p>
                    <p className="text-xs text-gray-500">{lead.service ?? 'Sem serviço'}</p>
                  </div>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                    {lead.funnel_stage === 'new' ? 'Novo' : lead.funnel_stage === 'negotiating' ? 'Negociando' : lead.funnel_stage}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Nenhum lead ainda!</p>
          )}
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-brand-700 to-brand-800 border-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">Sistema funcionando! 🚀</h3>
            <p className="text-brand-200 text-sm mt-1">Use o menu lateral para navegar entre os módulos.</p>
          </div>
          <div className="text-5xl opacity-20">🎨</div>
        </div>
      </Card>
    </div>
  )
}
