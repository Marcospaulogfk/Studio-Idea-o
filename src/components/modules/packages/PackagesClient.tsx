'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Package, PackageStatus, PackageModel } from '@/types'
import { Badge, Button, Card, Input, Select, PageHeader, KpiCard, ProgressBar, EmptyState } from '@/components/ui'
import { formatDate, daysRemaining, getPackageAlertLevel, cn } from '@/lib/utils'
import { Package as PackageIcon, AlertTriangle, CheckCircle, Clock, Pencil, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

const MODEL_OPTIONS = [
  { value: '5',      label: '5 artes' },
  { value: '10',     label: '10 artes' },
  { value: '20',     label: '20 artes' },
  { value: 'custom', label: 'Personalizado' },
]

const STATUS_OPTIONS = [
  { value: 'active',   label: 'Ativo' },
  { value: 'inactive', label: 'Finalizado' },
  { value: 'expired',  label: 'Expirado' },
]

export default function PackagesClient({ initialPackages }: { initialPackages: Package[] }) {
  const supabase = createClient()
  const [packages, setPackages] = useState<Package[]>(initialPackages)
  const [filter, setFilter] = useState<PackageStatus|'all'>('all')
  const [editing, setEditing] = useState<Package | null>(null)
  const [form, setForm] = useState({ model: 'custom' as PackageModel, arts_total: '0', arts_used: '0', expires_at: '', status: 'active' as PackageStatus })

  const filtered = filter === 'all' ? packages : packages.filter(p => p.status === filter)
  const active = packages.filter(p => p.status === 'active').length
  const expiring = packages.filter(p => p.status === 'active' && daysRemaining(p.expires_at) <= 15).length

  function startEdit(pkg: Package) {
    setEditing(pkg)
    setForm({
      model: pkg.model,
      arts_total: String(pkg.arts_total),
      arts_used: String(pkg.arts_used),
      expires_at: pkg.expires_at?.slice(0, 10) ?? '',
      status: pkg.status,
    })
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    const payload = {
      model: form.model,
      arts_total: Number(form.arts_total),
      arts_used: Number(form.arts_used),
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : editing.expires_at,
      status: form.status,
    }
    const { data, error } = await supabase.from('packages').update(payload).eq('id', editing.id).select().single()
    if (error) { toast.error('Erro ao atualizar'); return }
    setPackages(prev => prev.map(p => p.id === editing.id ? { ...p, ...data } : p))
    setEditing(null)
    toast.success('Pacote atualizado!')
  }

  async function markUsed(pkg: Package) {
    const newUsed = pkg.arts_used + 1
    const newStatus: PackageStatus = newUsed >= pkg.arts_total ? 'inactive' : pkg.status
    const { error } = await supabase.from('packages').update({ arts_used: newUsed, status: newStatus }).eq('id', pkg.id)
    if (error) { toast.error('Erro'); return }
    setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, arts_used: newUsed, status: newStatus } : p))
    toast.success('Arte registrada!')
  }

  async function handleDelete(pkg: Package) {
    if (!confirm(`Excluir este pacote? Produções vinculadas também serão removidas.`)) return
    const { error } = await supabase.from('packages').delete().eq('id', pkg.id)
    if (error) { toast.error('Erro ao excluir'); return }
    setPackages(prev => prev.filter(p => p.id !== pkg.id))
    toast.success('Pacote excluído')
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Pacotes" subtitle={`${active} ativos${expiring > 0 ? ` · ⚠️ ${expiring} vencendo` : ''}`} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="Pacotes Ativos" value={String(active)} icon={<PackageIcon size={20}/>} color="blue"/>
        <KpiCard title="Vencendo em 15 dias" value={String(expiring)} icon={<AlertTriangle size={20}/>} color={expiring>0?'yellow':'green'}/>
        <KpiCard title="Finalizados" value={String(packages.filter(p=>p.status==='inactive').length)} icon={<CheckCircle size={20}/>} color="green"/>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all','active','inactive','expired'] as const).map(s=>(
          <button key={s} onClick={()=>setFilter(s)}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
              filter===s ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white dark:bg-neutral-900 text-gray-600 dark:text-neutral-300 border-gray-200 dark:border-neutral-800 hover:border-orange-300')}>
            {s==='all'?'Todos':s==='active'?'Ativos':s==='inactive'?'Finalizados':'Expirados'}
            <span className="ml-1.5 opacity-70">{s==='all'?packages.length:packages.filter(p=>p.status===s).length}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-full">
            <EmptyState icon={<PackageIcon size={24}/>} title="Nenhum pacote encontrado" description="Pacotes são criados automaticamente ao registrar uma venda com pacote"/>
          </div>
        )}
        {filtered.map(pkg => {
          const days = daysRemaining(pkg.expires_at)
          const level = getPackageAlertLevel(days)
          const client = (pkg as any).client
          return (
            <Card key={pkg.id} className={cn('border-t-4 group', level==='critical'?'border-t-red-500':level==='warning'?'border-t-yellow-500':'border-t-green-500')}>
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-neutral-100 truncate">{client?.name ?? '—'}</p>
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">{pkg.model === 'custom' ? 'Personalizado' : `Pacote ${pkg.model} artes`}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant={pkg.status==='active'?'green':pkg.status==='expired'?'red':'gray'}>
                    {pkg.status==='active'?'Ativo':pkg.status==='expired'?'Expirado':'Finalizado'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-neutral-400">
                  <span>Progresso</span>
                  <span className="font-medium">{pkg.arts_used}/{pkg.arts_total} artes</span>
                </div>
                <ProgressBar value={pkg.arts_used} max={pkg.arts_total}/>
              </div>

              <div className="flex items-center justify-between text-xs mb-3">
                <div className={cn('flex items-center gap-1 font-medium', level==='critical'?'text-red-600 dark:text-red-400':level==='warning'?'text-yellow-600 dark:text-yellow-400':'text-green-600 dark:text-green-400')}>
                  <Clock size={12}/>
                  {days <= 0 ? 'Expirado' : `${days} dias restantes`}
                </div>
                <span className="text-gray-400 dark:text-neutral-500">Vence {formatDate(pkg.expires_at)}</span>
              </div>

              <div className="flex items-center gap-2">
                {pkg.status === 'active' && pkg.arts_used < pkg.arts_total && (
                  <button onClick={()=>markUsed(pkg)}
                    className="flex-1 text-xs font-medium text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 py-2 rounded-xl transition-colors">
                    + Registrar arte
                  </button>
                )}
                <button onClick={()=>startEdit(pkg)} className="p-2 rounded-xl text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors" title="Editar"><Pencil size={14}/></button>
                <button onClick={()=>handleDelete(pkg)} className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Excluir"><Trash2 size={14}/></button>
              </div>
            </Card>
          )
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-neutral-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">Editar Pacote</h2>
              <button onClick={()=>setEditing(null)}><X size={20} className="text-gray-400"/></button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <Select label="Modelo" options={MODEL_OPTIONS} value={form.model} onChange={e=>setForm(p=>({...p,model:e.target.value as PackageModel}))}/>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Total de artes *" type="number" min="1" value={form.arts_total} onChange={e=>setForm(p=>({...p,arts_total:e.target.value}))} required/>
                <Input label="Artes usadas" type="number" min="0" value={form.arts_used} onChange={e=>setForm(p=>({...p,arts_used:e.target.value}))}/>
              </div>
              <Input label="Vencimento" type="date" value={form.expires_at} onChange={e=>setForm(p=>({...p,expires_at:e.target.value}))}/>
              <Select label="Status" options={STATUS_OPTIONS} value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value as PackageStatus}))}/>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={()=>setEditing(null)} className="flex-1">Cancelar</Button>
                <Button type="submit" className="flex-1">Salvar alterações</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
