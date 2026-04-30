'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sale, Client, PaymentStatus, PAYMENT_STATUS_LABELS, ORIGIN_LABELS, LeadOrigin, SERVICES } from '@/types'
import { Button, Badge, Card, Input, Select, Textarea, PageHeader, KpiCard, EmptyState } from '@/components/ui'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Plus, X, ShoppingBag, DollarSign, TrendingUp, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const PAYMENT_OPTIONS = Object.entries(PAYMENT_STATUS_LABELS).map(([v,l])=>({value:v,label:l}))
const ORIGIN_OPTIONS = Object.entries(ORIGIN_LABELS).map(([v,l])=>({value:v,label:l}))
const SERVICE_OPTIONS = SERVICES.map(s=>({value:s,label:s}))

const PAYMENT_BADGE: Record<PaymentStatus, 'yellow'|'blue'|'green'> = { pending:'yellow','50%':'blue','100%':'green' }

export default function SalesClient({ initialSales, clients }: { initialSales: Sale[]; clients: Pick<Client, 'id' | 'name'>[] }) {
  const supabase = createClient()
  const [sales, setSales] = useState<Sale[]>(initialSales)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<PaymentStatus|'all'>('all')
  const [form, setForm] = useState({
    client_id: '', services: [] as string[], description: '',
    total_value: '', origin: '' as LeadOrigin|'',
    payment_status: 'pending' as PaymentStatus, client_type: 'new' as 'new'|'returning',
    paid_traffic: false, has_package: false, package_model: '10', package_arts_total: '10',
  })

  const filtered = filterStatus === 'all' ? sales : sales.filter(s => s.payment_status === filterStatus)
  const totalRevenue = sales.reduce((sum,s)=>sum+s.total_value,0)
  const received = sales.filter(s=>s.payment_status==='100%').reduce((sum,s)=>sum+s.total_value,0)
  const pending = sales.filter(s=>s.payment_status!=='100%').reduce((sum,s)=>sum+(s.payment_status==='50%'?s.total_value*0.5:s.total_value),0)

  const clientOptions = clients.map(c=>({value:c.id,label:c.name}))

  function toggleService(svc: string) {
    setForm(p=>({...p, services: p.services.includes(svc) ? p.services.filter(s=>s!==svc) : [...p.services, svc]}))
  }

  function resetForm() {
    setForm({ client_id:'',services:[],description:'',total_value:'',origin:'',payment_status:'pending',client_type:'new',paid_traffic:false,has_package:false,package_model:'10',package_arts_total:'10' })
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(sale: Sale) {
    setEditingId(sale.id)
    setForm({
      client_id: sale.client_id,
      services: sale.services ?? [],
      description: sale.description ?? '',
      total_value: String(sale.total_value),
      origin: sale.origin ?? '',
      payment_status: sale.payment_status,
      client_type: sale.client_type,
      paid_traffic: sale.paid_traffic,
      has_package: false, // pacote só na criação inicial
      package_model: '10',
      package_arts_total: '10',
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.client_id) { toast.error('Selecione um cliente'); return }
    if (form.services.length === 0) { toast.error('Selecione pelo menos um serviço'); return }

    const payload = {
      client_id: form.client_id,
      services: form.services,
      description: form.description || null,
      total_value: Number(form.total_value),
      origin: form.origin || null,
      payment_status: form.payment_status,
      client_type: form.client_type,
      paid_traffic: form.paid_traffic,
    }

    if (editingId) {
      const { data: sale, error } = await supabase.from('sales').update(payload).eq('id', editingId).select('*, client:clients(id,name,phone)').single()
      if (error) { toast.error('Erro ao atualizar venda'); return }
      setSales(prev => prev.map(s => s.id === editingId ? { ...s, ...sale } : s))
      toast.success('Venda atualizada!')
    } else {
      const { data: sale, error } = await supabase.from('sales').insert(payload).select('*, client:clients(id,name,phone)').single()
      if (error) { toast.error('Erro ao registrar venda'); return }
      if (form.has_package && sale) {
        await supabase.from('packages').insert({
          sale_id: sale.id,
          client_id: form.client_id,
          model: form.package_model,
          arts_total: Number(form.package_arts_total),
        })
      }
      setSales(prev => [sale, ...prev])
      toast.success('Venda registrada!')
    }
    resetForm()
  }

  async function handleDelete(sale: Sale) {
    if (!confirm(`Excluir esta venda de ${formatCurrency(sale.total_value)}? Pacotes e produções vinculadas também serão removidos.`)) return
    const { error } = await supabase.from('sales').delete().eq('id', sale.id)
    if (error) { toast.error('Não foi possível excluir — pode haver pós-vendas ou financeiros vinculados'); return }
    setSales(prev => prev.filter(s => s.id !== sale.id))
    toast.success('Venda excluída')
  }

  async function handleUpdatePayment(sale: Sale, status: PaymentStatus) {
    const { error } = await supabase.from('sales').update({ payment_status: status }).eq('id', sale.id)
    if (error) { toast.error('Erro'); return }
    setSales(prev => prev.map(s => s.id === sale.id ? {...s, payment_status: status} : s))
    toast.success('Status de pagamento atualizado!')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendas"
        subtitle={`${sales.length} vendas registradas`}
        action={<Button onClick={()=>{ setEditingId(null); setForm({ client_id:'',services:[],description:'',total_value:'',origin:'',payment_status:'pending',client_type:'new',paid_traffic:false,has_package:false,package_model:'10',package_arts_total:'10' }); setShowForm(true) }}><Plus size={16}/> Nova Venda</Button>}
      />

      <div className="grid grid-cols-3 gap-4">
        <KpiCard title="Faturamento Total" value={formatCurrency(totalRevenue)} icon={<TrendingUp size={20}/>} color="blue"/>
        <KpiCard title="Já Recebido" value={formatCurrency(received)} icon={<DollarSign size={20}/>} color="green"/>
        <KpiCard title="A Receber" value={formatCurrency(pending)} icon={<ShoppingBag size={20}/>} color="yellow"/>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {(['all','pending','50%','100%'] as const).map(s=>(
          <button key={s} onClick={()=>setFilterStatus(s)}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
              filterStatus===s ? 'bg-orange-700 text-white border-orange-700' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300')}>
            {s==='all'?'Todas':PAYMENT_STATUS_LABELS[s]}
            <span className="ml-1.5 opacity-70">{s==='all'?sales.length:sales.filter(x=>x.payment_status===s).length}</span>
          </button>
        ))}
      </div>

      {/* Tabela */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Serviços</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Valor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pagamento</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Data</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-sm text-gray-400">Nenhuma venda encontrada</td></tr>
              )}
              {filtered.map(sale => (
                <tr key={sale.id} className="hover:bg-orange-500/5 transition-colors group">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">{(sale as any).client?.name}</p>
                    <p className="text-xs text-gray-400">{sale.client_type === 'returning' ? '↩ Recorrente' : '✦ Novo'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {sale.services.slice(0,2).map(s=><span key={s} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">{s}</span>)}
                      {sale.services.length > 2 && <span className="text-xs text-gray-400">+{sale.services.length-2}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(sale.total_value)}</p>
                    {sale.paid_traffic && <p className="text-xs text-purple-600">Tráfego pago</p>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={PAYMENT_BADGE[sale.payment_status]}>
                      {PAYMENT_STATUS_LABELS[sale.payment_status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-neutral-400">{formatDate(sale.sold_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {sale.payment_status !== '100%' && (
                        <button
                          onClick={() => handleUpdatePayment(sale, sale.payment_status === 'pending' ? '50%' : '100%')}
                          className="px-2 py-1 rounded-lg text-xs font-medium text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors"
                        >
                          {sale.payment_status === 'pending' ? 'Marcar 50%' : 'Marcar pago'}
                        </button>
                      )}
                      <button onClick={()=>startEdit(sale)} className="p-1.5 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors" title="Editar"><Pencil size={14}/></button>
                      <button onClick={()=>handleDelete(sale)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Excluir"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Nova / Editar Venda */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900 rounded-t-2xl">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">{editingId ? 'Editar Venda' : 'Nova Venda'}</h2>
              <button onClick={resetForm}><X size={20} className="text-gray-400"/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Select label="Cliente *" options={clientOptions} value={form.client_id} onChange={e=>setForm(p=>({...p,client_id:e.target.value}))} required/>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Serviços *</p>
                <div className="flex flex-wrap gap-2">
                  {SERVICES.map(svc=>(
                    <button key={svc} type="button" onClick={()=>toggleService(svc)}
                      className={cn('px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                        form.services.includes(svc) ? 'bg-orange-700 text-white border-orange-700' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300')}>
                      {svc}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Valor Total *" type="number" step="0.01" value={form.total_value} onChange={e=>setForm(p=>({...p,total_value:e.target.value}))} required placeholder="0,00"/>
                <Select label="Status Pagamento" options={PAYMENT_OPTIONS} value={form.payment_status} onChange={e=>setForm(p=>({...p,payment_status:e.target.value as PaymentStatus}))}/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select label="Origem" options={ORIGIN_OPTIONS} value={form.origin} onChange={e=>setForm(p=>({...p,origin:e.target.value as LeadOrigin}))}/>
                <Select label="Tipo de Cliente" options={[{value:'new',label:'Novo'},{value:'returning',label:'Recorrente'}]} value={form.client_type} onChange={e=>setForm(p=>({...p,client_type:e.target.value as 'new'|'returning'}))}/>
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="paid_traffic" checked={form.paid_traffic} onChange={e=>setForm(p=>({...p,paid_traffic:e.target.checked}))} className="rounded"/>
                <label htmlFor="paid_traffic" className="text-sm text-gray-700">Veio de tráfego pago?</label>
              </div>

              {!editingId && (
                <div className="border border-gray-200 dark:border-neutral-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="has_package" checked={form.has_package} onChange={e=>setForm(p=>({...p,has_package:e.target.checked}))} className="rounded"/>
                    <label htmlFor="has_package" className="text-sm font-medium text-gray-700 dark:text-neutral-300">Incluir pacote de artes?</label>
                  </div>
                  {form.has_package && (
                    <div className="grid grid-cols-2 gap-4">
                      <Select label="Modelo" options={[{value:'5',label:'5 Artes'},{value:'10',label:'10 Artes'},{value:'20',label:'20 Artes'},{value:'custom',label:'Personalizado'}]} value={form.package_model} onChange={e=>setForm(p=>({...p,package_model:e.target.value}))}/>
                      <Input label="Qtd. de Artes" type="number" value={form.package_arts_total} onChange={e=>setForm(p=>({...p,package_arts_total:e.target.value}))}/>
                    </div>
                  )}
                </div>
              )}

              <Textarea label="Descrição" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Detalhes do que foi vendido..."/>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">Cancelar</Button>
                <Button type="submit" className="flex-1">{editingId ? 'Salvar alterações' : 'Registrar Venda'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
