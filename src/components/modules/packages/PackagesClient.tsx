'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Package, PackageStatus } from '@/types'
import { Badge, Card, PageHeader, KpiCard, ProgressBar, EmptyState } from '@/components/ui'
import { formatDate, daysRemaining, getPackageAlertLevel, cn } from '@/lib/utils'
import { Package as PackageIcon, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PackagesClient({ initialPackages }: { initialPackages: Package[] }) {
  const supabase = createClient()
  const [packages, setPackages] = useState<Package[]>(initialPackages)
  const [filter, setFilter] = useState<PackageStatus|'all'>('all')

  const filtered = filter === 'all' ? packages : packages.filter(p => p.status === filter)
  const active = packages.filter(p => p.status === 'active').length
  const expiring = packages.filter(p => p.status === 'active' && daysRemaining(p.expires_at) <= 15).length

  async function markUsed(pkg: Package) {
    const newUsed = pkg.arts_used + 1
    const newStatus = newUsed >= pkg.arts_total ? 'inactive' : pkg.status
    const { error } = await supabase.from('packages').update({ arts_used: newUsed, status: newStatus }).eq('id', pkg.id)
    if (error) { toast.error('Erro'); return }
    setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, arts_used: newUsed, status: newStatus } : p))
    toast.success('Arte registrada!')
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Pacotes" subtitle={`${active} ativos${expiring > 0 ? ` · ⚠️ ${expiring} vencendo` : ''}`} />

      <div className="grid grid-cols-3 gap-4">
        <KpiCard title="Pacotes Ativos" value={String(active)} icon={<PackageIcon size={20}/>} color="blue"/>
        <KpiCard title="Vencendo em 15 dias" value={String(expiring)} icon={<AlertTriangle size={20}/>} color={expiring>0?'yellow':'green'}/>
        <KpiCard title="Finalizados" value={String(packages.filter(p=>p.status==='inactive').length)} icon={<CheckCircle size={20}/>} color="green"/>
      </div>

      <div className="flex gap-2">
        {(['all','active','inactive','expired'] as const).map(s=>(
          <button key={s} onClick={()=>setFilter(s)}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
              filter===s?'bg-orange-700 text-white border-orange-700':'bg-white text-gray-600 border-gray-200')}>
            {s==='all'?'Todos':s==='active'?'Ativos':s==='inactive'?'Finalizados':'Expirados'}
            <span className="ml-1.5 opacity-70">{s==='all'?packages.length:packages.filter(p=>p.status===s).length}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-3">
            <EmptyState icon={<PackageIcon size={24}/>} title="Nenhum pacote encontrado" description="Pacotes são criados automaticamente ao registrar uma venda com pacote"/>
          </div>
        )}
        {filtered.map(pkg => {
          const days = daysRemaining(pkg.expires_at)
          const level = getPackageAlertLevel(days)
          const client = (pkg as any).client
          return (
            <Card key={pkg.id} className={cn('border-t-4', level==='critical'?'border-t-red-500':level==='warning'?'border-t-yellow-500':'border-t-green-500')}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{client?.name ?? '—'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{pkg.model === 'custom' ? 'Personalizado' : `Pacote ${pkg.model} artes`}</p>
                </div>
                <Badge variant={pkg.status==='active'?'green':pkg.status==='expired'?'red':'gray'}>
                  {pkg.status==='active'?'Ativo':pkg.status==='expired'?'Expirado':'Finalizado'}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Progresso</span>
                  <span className="font-medium">{pkg.arts_used}/{pkg.arts_total} artes</span>
                </div>
                <ProgressBar value={pkg.arts_used} max={pkg.arts_total}/>
              </div>

              <div className="flex items-center justify-between text-xs mb-3">
                <div className={cn('flex items-center gap-1 font-medium', level==='critical'?'text-red-600':level==='warning'?'text-yellow-600':'text-green-600')}>
                  <Clock size={12}/>
                  {days <= 0 ? 'Expirado' : `${days} dias restantes`}
                </div>
                <span className="text-gray-400">Vence {formatDate(pkg.expires_at)}</span>
              </div>

              {pkg.status === 'active' && pkg.arts_used < pkg.arts_total && (
                <button onClick={()=>markUsed(pkg)}
                  className="w-full text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 py-2 rounded-xl transition-colors">
                  + Registrar Arte Utilizada
                </button>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
