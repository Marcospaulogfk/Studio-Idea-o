'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Client, CreateClientForm } from '@/types'
import { Button, Badge, Card, Input, PageHeader, EmptyState, KpiCard } from '@/components/ui'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Plus, X, Users, TrendingUp, Search, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ClientsClient({ initialClients }: { initialClients: Client[] }) {
  const supabase = createClient()
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateClientForm>({ name: '', phone: '', cpf_cnpj: '', address: '' })

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.cpf_cnpj?.includes(search)
  )

  const totalLTV = clients.reduce((sum, c) => sum + (c.ltv ?? 0), 0)
  const activeCount = clients.filter(c => c.status === 'active').length

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const { data, error } = await supabase.from('clients').insert(form).select().single()
    if (error) { toast.error('Erro ao criar cliente'); return }
    setClients(prev => [data, ...prev])
    setForm({ name: '', phone: '', cpf_cnpj: '', address: '' })
    setShowForm(false)
    toast.success('Cliente criado!')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        subtitle={`${activeCount} ativos · Base total de ${clients.length}`}
        action={<Button onClick={() => setShowForm(true)}><Plus size={16} /> Novo Cliente</Button>}
      />

      <div className="grid grid-cols-3 gap-4">
        <KpiCard title="Total de Clientes" value={String(clients.length)} icon={<Users size={20}/>} color="blue" />
        <KpiCard title="LTV Total da Base" value={formatCurrency(totalLTV)} icon={<TrendingUp size={20}/>} color="green" />
        <KpiCard title="Clientes Ativos" value={String(activeCount)} icon={<Users size={20}/>} color="purple" />
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, telefone ou CNPJ..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Lista */}
      <Card className="p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={<Users size={24}/>} title="Nenhum cliente encontrado" description="Adicione seu primeiro cliente clicando em Novo Cliente" action={<Button onClick={() => setShowForm(true)}>Novo Cliente</Button>} />
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(client => (
              <div key={client.id}>
                <div
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setExpandedId(expandedId === client.id ? null : client.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center">
                      <span className="text-brand-700 font-bold text-sm">{client.name[0].toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{client.name}</p>
                      <p className="text-xs text-gray-500">{client.phone ?? '—'} {client.cpf_cnpj ? `· ${client.cpf_cnpj.replace(/\d(?=\d{3})/g,'*')}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-700">{formatCurrency(client.ltv ?? 0)}</p>
                      <p className="text-xs text-gray-400">LTV</p>
                    </div>
                    <Badge variant={client.status === 'active' ? 'green' : 'gray'}>
                      {client.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                    {expandedId === client.id ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
                  </div>
                </div>

                {/* Expansão com histórico */}
                {expandedId === client.id && (
                  <div className="px-6 pb-4 bg-gray-50/50 border-t border-gray-100">
                    <div className="pt-3 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Endereço</p>
                        <p className="text-gray-700">{client.address ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Cliente desde</p>
                        <p className="text-gray-700">{formatDate(client.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Serviços contratados</p>
                        <p className="text-gray-700">{(client as any).sales?.length ?? 0} vendas</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal: Novo Cliente */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Novo Cliente</h2>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-gray-400"/></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <Input label="Nome completo *" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} required />
              <Input label="Telefone" value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))} placeholder="(46) 99999-0000"/>
              <Input label="CPF / CNPJ" value={form.cpf_cnpj} onChange={e => setForm(p=>({...p,cpf_cnpj:e.target.value}))} />
              <Input label="Endereço" value={form.address} onChange={e => setForm(p=>({...p,address:e.target.value}))} />
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Cancelar</Button>
                <Button type="submit" className="flex-1">Criar Cliente</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
