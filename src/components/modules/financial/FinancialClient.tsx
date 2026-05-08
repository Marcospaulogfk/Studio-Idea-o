'use client'
import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Financial, FinancialType, FinancialRecurrence, RECURRENCE_LABELS } from '@/types'
import { Button, Badge, Card, Input, MoneyInput, Select, PageHeader, KpiCard } from '@/components/ui'
import { DateRangeFilter, inRange, type DateRange, type PresetId } from '@/components/ui/date-range'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Plus, X, TrendingUp, TrendingDown, ArrowUpDown, Pencil, Trash2, Download, Repeat } from 'lucide-react'
import toast from 'react-hot-toast'
import { downloadCsv } from '@/lib/csv'

const CAT_OPTIONS = [
  {value:'personal',label:'Pessoal'},{value:'tools',label:'Ferramentas'},
  {value:'marketing',label:'Marketing'},{value:'rent',label:'Aluguel'},
  {value:'taxes',label:'Impostos'},{value:'ads',label:'Anúncios'},{value:'other',label:'Outros'},
]

const RECURRENCE_OPTIONS = [
  { value: 'none',    label: 'Não recorre' },
  { value: 'weekly',  label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'yearly',  label: 'Anual' },
]

export default function FinancialClient({ initialFinancials }: { initialFinancials: Financial[] }) {
  const supabase = createClient()
  const [financials, setFinancials] = useState<Financial[]>(initialFinancials)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<FinancialType|'all'>('all')
  const [datePreset, setDatePreset] = useState<PresetId>('all')
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null })
  const [form, setForm] = useState({ type:'payable' as FinancialType, description:'', amount:'', category:'other', due_date:'', recurrence: 'none' as FinancialRecurrence })

  const filtered = useMemo(() => financials.filter(f => {
    if (filter !== 'all' && f.type !== filter) return false
    if (datePreset !== 'all') {
      const refDate = f.due_date ?? f.created_at
      if (!inRange(refDate, dateRange)) return false
    }
    return true
  }), [financials, filter, datePreset, dateRange])

  const totalReceivable = filtered.filter(f=>f.type==='receivable'&&f.status!=='paid').reduce((s,f)=>s+f.amount,0)
  const totalPayable = filtered.filter(f=>f.type==='payable'&&f.status!=='paid').reduce((s,f)=>s+f.amount,0)
  const balance = totalReceivable - totalPayable

  function handleExport() {
    if (filtered.length === 0) { toast('Sem lançamentos no filtro atual'); return }
    downloadCsv(`financeiro-${new Date().toISOString().slice(0,10)}`, filtered, [
      { header: 'Descrição',     accessor: f => f.description },
      { header: 'Tipo',          accessor: f => f.type === 'receivable' ? 'Entrada' : 'Saída' },
      { header: 'Categoria',     accessor: f => f.category ?? '' },
      { header: 'Valor (BRL)',   accessor: f => f.amount.toFixed(2).replace('.', ',') },
      { header: 'Vencimento',    accessor: f => f.due_date ? formatDate(f.due_date) : '' },
      { header: 'Status',        accessor: f => f.status === 'paid' ? 'Pago' : f.status === 'overdue' ? 'Vencido' : 'Pendente' },
      { header: 'Recorrência',   accessor: f => RECURRENCE_LABELS[f.recurrence ?? 'none'] },
      { header: 'Pago em',       accessor: f => f.paid_at ? formatDate(f.paid_at) : '' },
    ])
  }

  function resetForm() {
    setForm({ type:'payable', description:'', amount:'', category:'other', due_date:'', recurrence: 'none' })
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(f: Financial) {
    setEditingId(f.id)
    setForm({
      type: f.type,
      description: f.description,
      amount: String(f.amount),
      category: f.category ?? 'other',
      due_date: f.due_date ?? '',
      recurrence: (f.recurrence ?? 'none') as FinancialRecurrence,
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      type: form.type,
      description: form.description,
      amount: Number(form.amount),
      category: form.category,
      due_date: form.due_date || null,
      recurrence: form.recurrence,
    }
    if (editingId) {
      const { data, error } = await supabase.from('financials').update(payload).eq('id', editingId).select().single()
      if (error) { toast.error('Erro ao atualizar'); return }
      setFinancials(prev => prev.map(f => f.id === editingId ? { ...f, ...data } : f))
      toast.success('Lançamento atualizado!')
    } else {
      const { data, error } = await supabase.from('financials').insert(payload).select().single()
      if (error) { toast.error('Erro'); return }
      setFinancials(prev => [data, ...prev])
      toast.success('Lançamento criado!')
    }
    resetForm()
  }

  async function markPaid(f: Financial) {
    const { error } = await supabase.from('financials').update({ status:'paid', paid_at: new Date().toISOString() }).eq('id', f.id)
    if (error) { toast.error('Erro'); return }
    setFinancials(prev => prev.map(x => x.id === f.id ? {...x, status:'paid', paid_at: new Date().toISOString()} : x))

    // Se for recorrente, o trigger criou a próxima ocorrência automaticamente — busca ela
    if (f.recurrence && f.recurrence !== 'none') {
      const { data: spawned } = await supabase
        .from('financials')
        .select('*, sale:sales(id, client:clients(name))')
        .eq('recurrence_parent_id', f.id)
        .order('due_date', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (spawned && !financials.some(x => x.id === spawned.id)) {
        setFinancials(prev => [spawned as Financial, ...prev])
        toast.success(`Pago! Próxima ${RECURRENCE_LABELS[f.recurrence].toLowerCase()} criada para ${spawned.due_date ? formatDate(spawned.due_date) : 'data calculada'}`)
        return
      }
    }
    toast.success('Marcado como pago!')
  }

  async function handleDelete(f: Financial) {
    if (!confirm(`Excluir o lançamento "${f.description}"?`)) return
    const { error } = await supabase.from('financials').delete().eq('id', f.id)
    if (error) { toast.error('Erro ao excluir'); return }
    setFinancials(prev => prev.filter(x => x.id !== f.id))
    toast.success('Lançamento excluído')
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Financeiro" subtitle={`${filtered.length} de ${financials.length} lançamentos`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExport}><Download size={14}/> Exportar</Button>
            <Button onClick={()=>{ setEditingId(null); setShowForm(true) }}><Plus size={16}/> Novo Lançamento</Button>
          </div>
        }/>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="A Receber" value={formatCurrency(totalReceivable)} icon={<TrendingUp size={20}/>} color="green"/>
        <KpiCard title="A Pagar" value={formatCurrency(totalPayable)} icon={<TrendingDown size={20}/>} color="red"/>
        <KpiCard title="Saldo Projetado" value={formatCurrency(balance)} icon={<ArrowUpDown size={20}/>} color={balance>=0?'blue':'red'}/>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <DateRangeFilter
          preset={datePreset}
          range={dateRange}
          onChange={(p, r) => { setDatePreset(p); setDateRange(r) }}
        />
        {(['all','receivable','payable'] as const).map(t=>(
          <button key={t} onClick={()=>setFilter(t)}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
              filter===t ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white dark:bg-neutral-900 text-gray-600 dark:text-neutral-300 border-gray-200 dark:border-neutral-800 hover:border-orange-300')}>
            {t==='all'?'Todos':t==='receivable'?'A Receber':'A Pagar'}
          </button>
        ))}
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-950/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase">Descrição</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase">Valor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase">Vencimento</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-neutral-800">
              {filtered.length===0 && <tr><td colSpan={6} className="text-center py-10 text-sm text-gray-400 dark:text-neutral-500">Nenhum lançamento</td></tr>}
              {filtered.map(f=>(
                <tr key={f.id} className="hover:bg-orange-500/5 transition-colors group">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-neutral-100">
                    <div className="flex items-center gap-2">
                      {f.recurrence && f.recurrence !== 'none' && (
                        <span title={`Recorrência: ${RECURRENCE_LABELS[f.recurrence]}`} className="inline-flex items-center text-orange-500 dark:text-orange-400 shrink-0">
                          <Repeat size={13} />
                        </span>
                      )}
                      <span className="truncate">{f.description}</span>
                    </div>
                    {f.recurrence && f.recurrence !== 'none' && (
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-neutral-500 mt-0.5">{RECURRENCE_LABELS[f.recurrence]}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={f.type==='receivable'?'green':'red'}>{f.type==='receivable'?'↓ Entrada':'↑ Saída'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-neutral-100">{formatCurrency(f.amount)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-neutral-400">{f.due_date ? formatDate(f.due_date) : '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={f.status==='paid'?'green':f.status==='overdue'?'red':'yellow'} pulse={f.status==='overdue'}>
                      {f.status==='paid'?'Pago':f.status==='overdue'?'Vencido':'Pendente'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {f.status!=='paid' && (
                        <button onClick={()=>markPaid(f)} className="px-2 py-1 rounded-lg text-xs font-medium text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors">
                          Marcar pago
                        </button>
                      )}
                      <button onClick={()=>startEdit(f)} className="p-1.5 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors" title="Editar"><Pencil size={14}/></button>
                      <button onClick={()=>handleDelete(f)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Excluir"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-neutral-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">{editingId ? 'Editar Lançamento' : 'Novo Lançamento'}</h2>
              <button onClick={resetForm}><X size={20} className="text-gray-400"/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Select label="Tipo" options={[{value:'receivable',label:'A Receber (Entrada)'},{value:'payable',label:'A Pagar (Saída)'}]} value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value as FinancialType}))}/>
              <Input label="Descrição *" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} required/>
              <div className="grid grid-cols-2 gap-4">
                <MoneyInput label="Valor *" value={form.amount === '' ? '' : Number(form.amount)} onChange={n=>setForm(p=>({...p,amount:n ? String(n) : ''}))} required/>
                <Input label="Vencimento" type="date" value={form.due_date} onChange={e=>setForm(p=>({...p,due_date:e.target.value}))}/>
              </div>
              <Select label="Categoria" options={CAT_OPTIONS} value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}/>
              <Select
                label="Recorrência"
                options={RECURRENCE_OPTIONS}
                value={form.recurrence}
                onChange={e=>setForm(p=>({...p,recurrence:e.target.value as FinancialRecurrence}))}
              />
              {form.recurrence !== 'none' && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20">
                  <Repeat size={14} className="text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    Quando você marcar como pago, o sistema cria automaticamente a próxima ocorrência <strong>{RECURRENCE_LABELS[form.recurrence].toLowerCase()}</strong> com data ajustada.
                  </p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">Cancelar</Button>
                <Button type="submit" className="flex-1">{editingId ? 'Salvar alterações' : 'Criar'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
