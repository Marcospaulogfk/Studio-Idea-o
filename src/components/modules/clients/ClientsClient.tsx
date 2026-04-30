'use client'
import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Client, CreateClientForm } from '@/types'
import { Button, Badge, Card, Input, PageHeader, EmptyState, KpiCard } from '@/components/ui'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Plus, X, Users, TrendingUp, Search, ChevronDown, ChevronUp, Pencil, Trash2, Power } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ClientsClient({ initialClients }: { initialClients: Client[] }) {
  const supabase = createClient()
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateClientForm>({ name: '', phone: '', cpf_cnpj: '', address: '' })

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.cpf_cnpj?.includes(search)
  )

  const totalLTV = clients.reduce((sum, c) => sum + (c.ltv ?? 0), 0)
  const activeCount = clients.filter(c => c.status === 'active').length

  function resetForm() {
    setForm({ name: '', phone: '', cpf_cnpj: '', address: '' })
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(c: Client, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingId(c.id)
    setForm({ name: c.name, phone: c.phone ?? '', cpf_cnpj: c.cpf_cnpj ?? '', address: c.address ?? '' })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      name: form.name,
      phone: form.phone || null,
      cpf_cnpj: form.cpf_cnpj || null,
      address: form.address || null,
    }
    if (editingId) {
      const { data, error } = await supabase.from('clients').update(payload).eq('id', editingId).select().single()
      if (error) { toast.error('Erro ao atualizar'); return }
      setClients(prev => prev.map(c => c.id === editingId ? { ...c, ...data } : c))
      toast.success('Cliente atualizado!')
    } else {
      const { data, error } = await supabase.from('clients').insert(payload).select().single()
      if (error) { toast.error('Erro ao criar cliente'); return }
      setClients(prev => [data, ...prev])
      toast.success('Cliente criado!')
    }
    resetForm()
  }

  async function toggleStatus(c: Client, e: React.MouseEvent) {
    e.stopPropagation()
    const newStatus = c.status === 'active' ? 'inactive' : 'active'
    const { error } = await supabase.from('clients').update({ status: newStatus }).eq('id', c.id)
    if (error) { toast.error('Erro'); return }
    setClients(prev => prev.map(x => x.id === c.id ? { ...x, status: newStatus } : x))
    toast.success(newStatus === 'active' ? 'Cliente reativado' : 'Cliente desativado')
  }

  async function handleDelete(c: Client, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Excluir definitivamente "${c.name}"? Esta ação não pode ser desfeita.\n\n(Se houver vendas vinculadas, o sistema vai impedir e você pode usar "desativar" no lugar.)`)) return
    const { error } = await supabase.from('clients').delete().eq('id', c.id)
    if (error) { toast.error('Não foi possível excluir — existem vendas/pacotes vinculados. Use "Desativar" no lugar.'); return }
    setClients(prev => prev.filter(x => x.id !== c.id))
    toast.success('Cliente excluído')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        subtitle={`${activeCount} ativos · Base total de ${clients.length}`}
        action={<Button onClick={() => { setEditingId(null); setForm({ name: '', phone: '', cpf_cnpj: '', address: '' }); setShowForm(true) }}><Plus size={16} /> Novo Cliente</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="Total de Clientes" value={String(clients.length)} icon={<Users size={20}/>} color="blue" />
        <KpiCard title="LTV Total da Base" value={formatCurrency(totalLTV)} icon={<TrendingUp size={20}/>} color="green" />
        <KpiCard title="Clientes Ativos" value={String(activeCount)} icon={<Users size={20}/>} color="purple" />
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, telefone ou CNPJ..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <Card className="p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={<Users size={24}/>} title="Nenhum cliente encontrado" description="Adicione seu primeiro cliente clicando em Novo Cliente" action={<Button onClick={() => { setEditingId(null); setShowForm(true) }}>Novo Cliente</Button>} />
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-neutral-800">
            {filtered.map(client => (
              <div key={client.id}>
                <div
                  className="flex items-center justify-between px-6 py-4 hover:bg-orange-500/5 cursor-pointer transition-colors group"
                  onClick={() => setExpandedId(expandedId === client.id ? null : client.id)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-9 h-9 bg-orange-100 dark:bg-orange-500/20 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-orange-700 dark:text-orange-400 font-bold text-sm">{client.name[0].toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-neutral-100 text-sm truncate">{client.name}</p>
                      <p className="text-xs text-gray-500 dark:text-neutral-400 truncate">{client.phone ?? '—'} {client.cpf_cnpj ? `· ${client.cpf_cnpj.replace(/\d(?=\d{3})/g,'*')}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(client.ltv ?? 0)}</p>
                      <p className="text-xs text-gray-400">LTV</p>
                    </div>
                    <Badge variant={client.status === 'active' ? 'green' : 'gray'}>
                      {client.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e)=>startEdit(client,e)} className="p-1.5 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors" title="Editar"><Pencil size={14}/></button>
                      <button onClick={(e)=>toggleStatus(client,e)} className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 transition-colors" title={client.status==='active'?'Desativar':'Reativar'}><Power size={14}/></button>
                      <button onClick={(e)=>handleDelete(client,e)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Excluir"><Trash2 size={14}/></button>
                    </div>
                    {expandedId === client.id ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
                  </div>
                </div>

                {expandedId === client.id && (
                  <div className="px-6 pb-4 bg-gray-50/50 dark:bg-neutral-950/50 border-t border-gray-100 dark:border-neutral-800">
                    <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1">Endereço</p>
                        <p className="text-gray-700 dark:text-neutral-300">{client.address ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1">Cliente desde</p>
                        <p className="text-gray-700 dark:text-neutral-300">{formatDate(client.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1">Vendas</p>
                        <p className="text-gray-700 dark:text-neutral-300">{(client as any).sales?.length ?? 0}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Link href={`/clients/${client.id}`} onClick={(e)=>e.stopPropagation()} className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 dark:hover:text-orange-400">
                        Ver detalhes completos →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-neutral-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">{editingId ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <button onClick={resetForm}><X size={20} className="text-gray-400"/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input label="Nome completo *" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} required />
              <Input label="Telefone" value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))} placeholder="(46) 99999-0000"/>
              <Input label="CPF / CNPJ" value={form.cpf_cnpj} onChange={e => setForm(p=>({...p,cpf_cnpj:e.target.value}))} />
              <Input label="Endereço" value={form.address} onChange={e => setForm(p=>({...p,address:e.target.value}))} />
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">Cancelar</Button>
                <Button type="submit" className="flex-1">{editingId ? 'Salvar alterações' : 'Criar Cliente'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
