'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Financial, FinancialType, FinancialStatus } from '@/types'
import { Button, Badge, Card, Input, Select, PageHeader, KpiCard, EmptyState } from '@/components/ui'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Plus, X, DollarSign, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react'
import toast from 'react-hot-toast'

const CAT_OPTIONS = [
  {value:'personal',label:'Pessoal'},{value:'tools',label:'Ferramentas'},
  {value:'marketing',label:'Marketing'},{value:'rent',label:'Aluguel'},
  {value:'taxes',label:'Impostos'},{value:'ads',label:'Anúncios'},{value:'other',label:'Outros'},
]

export default function FinancialClient({ initialFinancials }: { initialFinancials: Financial[] }) {
  const supabase = createClient()
  const [financials, setFinancials] = useState<Financial[]>(initialFinancials)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<FinancialType|'all'>('all')
  const [form, setForm] = useState({ type:'payable' as FinancialType, description:'', amount:'', category:'other', due_date:'' })

  const filtered = filter === 'all' ? financials : financials.filter(f => f.type === filter)
  const totalReceivable = financials.filter(f=>f.type==='receivable'&&f.status!=='paid').reduce((s,f)=>s+f.amount,0)
  const totalPayable = financials.filter(f=>f.type==='payable'&&f.status!=='paid').reduce((s,f)=>s+f.amount,0)
  const balance = totalReceivable - totalPayable

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const { data, error } = await supabase.from('financials').insert({
      type: form.type, description: form.description,
      amount: Number(form.amount), category: form.category,
      due_date: form.due_date || null,
    }).select().single()
    if (error) { toast.error('Erro'); return }
    setFinancials(prev => [data, ...prev])
    setShowForm(false)
    setForm({ type:'payable', description:'', amount:'', category:'other', due_date:'' })
    toast.success('Lançamento criado!')
  }

  async function markPaid(f: Financial) {
    const { error } = await supabase.from('financials').update({ status:'paid', paid_at: new Date().toISOString() }).eq('id', f.id)
    if (error) { toast.error('Erro'); return }
    setFinancials(prev => prev.map(x => x.id === f.id ? {...x, status:'paid', paid_at: new Date().toISOString()} : x))
    toast.success('Marcado como pago!')
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Financeiro" subtitle="Controle de caixa — entradas e saídas"
        action={<Button onClick={()=>setShowForm(true)}><Plus size={16}/> Novo Lançamento</Button>}/>

      <div className="grid grid-cols-3 gap-4">
        <KpiCard title="A Receber" value={formatCurrency(totalReceivable)} icon={<TrendingUp size={20}/>} color="green"/>
        <KpiCard title="A Pagar" value={formatCurrency(totalPayable)} icon={<TrendingDown size={20}/>} color="red"/>
        <KpiCard title="Saldo Projetado" value={formatCurrency(balance)} icon={<ArrowUpDown size={20}/>} color={balance>=0?'blue':'red'}/>
      </div>

      <div className="flex gap-2">
        {(['all','receivable','payable'] as const).map(t=>(
          <button key={t} onClick={()=>setFilter(t)}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
              filter===t?'bg-orange-700 text-white border-orange-700':'bg-white text-gray-600 border-gray-200')}>
            {t==='all'?'Todos':t==='receivable'?'A Receber':'A Pagar'}
          </button>
        ))}
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Descrição</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Valor</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Vencimento</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length===0&&<tr><td colSpan={6} className="text-center py-10 text-sm text-gray-400">Nenhum lançamento</td></tr>}
            {filtered.map(f=>(
              <tr key={f.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{f.description}</td>
                <td className="px-4 py-3">
                  <Badge variant={f.type==='receivable'?'green':'red'}>{f.type==='receivable'?'↓ Entrada':'↑ Saída'}</Badge>
                </td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900">{formatCurrency(f.amount)}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{f.due_date ? formatDate(f.due_date) : '—'}</td>
                <td className="px-4 py-3">
                  <Badge variant={f.status==='paid'?'green':f.status==='overdue'?'red':'yellow'}>
                    {f.status==='paid'?'Pago':f.status==='overdue'?'Vencido':'Pendente'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {f.status!=='paid'&&<button onClick={()=>markPaid(f)} className="text-xs text-orange-700 hover:underline font-medium">Marcar pago</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Novo Lançamento</h2>
              <button onClick={()=>setShowForm(false)}><X size={20} className="text-gray-400"/></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <Select label="Tipo" options={[{value:'receivable',label:'A Receber (Entrada)'},{value:'payable',label:'A Pagar (Saída)'}]} value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value as FinancialType}))}/>
              <Input label="Descrição *" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} required/>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Valor *" type="number" step="0.01" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} required/>
                <Input label="Vencimento" type="date" value={form.due_date} onChange={e=>setForm(p=>({...p,due_date:e.target.value}))}/>
              </div>
              <Select label="Categoria" options={CAT_OPTIONS} value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}/>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={()=>setShowForm(false)} className="flex-1">Cancelar</Button>
                <Button type="submit" className="flex-1">Criar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
