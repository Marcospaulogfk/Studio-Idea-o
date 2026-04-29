'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Lead, LeadStage, LEAD_STAGE_LABELS, ORIGIN_LABELS, LeadOrigin, SERVICES } from '@/types'
import { Button, Badge, Card, Input, Select, Textarea, PageHeader, EmptyState } from '@/components/ui'
import { formatCurrency, formatRelative, getFollowupUrgency, cn } from '@/lib/utils'
import { Plus, Phone, Clock, ChevronRight, X, CheckCircle, Calendar, AlertCircle, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

const STAGES: LeadStage[] = ['new', 'negotiating', 'closed', 'disqualified', 'future']

const STAGE_COLORS: Record<LeadStage, string> = {
  new:           'border-l-blue-500 bg-blue-50/30',
  negotiating:   'border-l-yellow-500 bg-yellow-50/30',
  closed:        'border-l-green-500 bg-green-50/30',
  disqualified:  'border-l-red-500 bg-red-50/30',
  future:        'border-l-purple-500 bg-purple-50/30',
}

const STAGE_BADGE: Record<LeadStage, 'blue' | 'yellow' | 'green' | 'red' | 'purple'> = {
  new: 'blue', negotiating: 'yellow', closed: 'green', disqualified: 'red', future: 'purple'
}

const ORIGIN_OPTIONS = Object.entries(ORIGIN_LABELS).map(([value, label]) => ({ value, label }))
const SERVICE_OPTIONS = SERVICES.map(s => ({ value: s, label: s }))

interface Props { initialLeads: Lead[] }

export default function LeadsClient({ initialLeads }: Props) {
  const supabase = createClient()
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [showForm, setShowForm] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [filterStage, setFilterStage] = useState<LeadStage | 'all'>('all')
  const [isPending, startTransition] = useTransition()

  // Formulário
  const [form, setForm] = useState({
    name: '', phone: '', service: '', estimated_value: '',
    origin: '' as LeadOrigin | '', notes: ''
  })

  const filteredLeads = filterStage === 'all'
    ? leads.filter(l => l.funnel_stage !== 'closed' && l.funnel_stage !== 'disqualified')
    : leads.filter(l => l.funnel_stage === filterStage)

  const leadsByStage = STAGES.reduce((acc, stage) => {
    acc[stage] = filteredLeads.filter(l => l.funnel_stage === stage)
    return acc
  }, {} as Record<LeadStage, Lead[]>)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const { data, error } = await supabase.from('leads').insert({
      name: form.name,
      phone: form.phone || null,
      service: form.service || null,
      estimated_value: form.estimated_value ? Number(form.estimated_value) : null,
      origin: form.origin || null,
      notes: form.notes || null,
      funnel_stage: 'new',
    }).select().single()

    if (error) { toast.error('Erro ao criar lead'); return }
    setLeads(prev => [data, ...prev])
    setForm({ name: '', phone: '', service: '', estimated_value: '', origin: '', notes: '' })
    setShowForm(false)
    toast.success('Lead criado com sucesso!')
  }

  async function handleStageChange(lead: Lead, newStage: LeadStage) {
    const { error } = await supabase
      .from('leads')
      .update({ funnel_stage: newStage, updated_at: new Date().toISOString() })
      .eq('id', lead.id)

    if (error) { toast.error('Erro ao atualizar status'); return }
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, funnel_stage: newStage } : l))
    if (selectedLead?.id === lead.id) setSelectedLead({ ...lead, funnel_stage: newStage })
    toast.success('Status atualizado!')
  }

  async function handleContacted(lead: Lead) {
    const now = new Date().toISOString()
    const { error } = await supabase.from('leads').update({ last_contact: now }).eq('id', lead.id)
    if (error) { toast.error('Erro'); return }

    await supabase.from('followups').insert({
      lead_id: lead.id,
      contacted_at: now,
      notes: 'Contato realizado',
    })

    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, last_contact: now } : l))
    toast.success('Contato registrado!')
  }

  const urgencyBadge = (lead: Lead) => {
    const urgency = getFollowupUrgency(lead.last_contact ?? null)
    if (urgency === 'critical') return <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
    if (urgency === 'warning')  return <span className="w-2 h-2 rounded-full bg-yellow-500" />
    return null
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        subtitle={`${leads.length} leads • ${leads.filter(l => l.funnel_stage === 'negotiating').length} em negociação`}
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} /> Novo Lead
          </Button>
        }
      />

      {/* Filtros por estágio */}
      <div className="flex gap-2 flex-wrap">
        {([['all', 'Ativos'], ...STAGES.map(s => [s, LEAD_STAGE_LABELS[s]])] as [string, string][]).map(([stage, label]) => (
          <button
            key={stage}
            onClick={() => setFilterStage(stage as LeadStage | 'all')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-medium transition-all border',
              filterStage === stage
                ? 'bg-brand-700 text-white border-brand-700'
                : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
            )}
          >
            {label}
            <span className="ml-1.5 opacity-70">
              {stage === 'all'
                ? leads.filter(l => l.funnel_stage !== 'closed' && l.funnel_stage !== 'disqualified').length
                : leads.filter(l => l.funnel_stage === stage).length}
            </span>
          </button>
        ))}
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {STAGES.map(stage => {
          const stageLeads = leadsByStage[stage] ?? []
          if (filterStage !== 'all' && filterStage !== stage) return null

          return (
            <div key={stage} className="space-y-3">
              {/* Coluna header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={STAGE_BADGE[stage]}>{LEAD_STAGE_LABELS[stage]}</Badge>
                  <span className="text-xs text-gray-400 font-medium">{stageLeads.length}</span>
                </div>
              </div>

              {/* Cards */}
              <div className="space-y-2 min-h-16">
                {stageLeads.length === 0 && (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-400">Vazio</p>
                  </div>
                )}
                {stageLeads.map(lead => (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={cn(
                      'bg-white border-l-4 rounded-xl p-3 shadow-sm cursor-pointer hover:shadow-md transition-all',
                      STAGE_COLORS[lead.funnel_stage]
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 leading-tight">{lead.name}</p>
                      {urgencyBadge(lead)}
                    </div>
                    {lead.service && <p className="text-xs text-gray-500 mt-0.5">{lead.service}</p>}
                    {lead.estimated_value && (
                      <p className="text-xs font-medium text-green-700 mt-1">{formatCurrency(lead.estimated_value)}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {lead.origin && (
                        <span className="text-xs text-gray-400">{ORIGIN_LABELS[lead.origin as LeadOrigin]}</span>
                      )}
                      {lead.last_contact && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={10} /> {formatRelative(lead.last_contact)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal: Novo Lead */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Novo Lead</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <Input label="Nome *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Telefone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="(46) 99999-0000" />
                <Input label="Valor Estimado" type="number" value={form.estimated_value} onChange={e => setForm(p => ({ ...p, estimated_value: e.target.value }))} placeholder="0,00" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Serviço de Interesse" options={SERVICE_OPTIONS} value={form.service} onChange={e => setForm(p => ({ ...p, service: e.target.value }))} />
                <Select label="Origem" options={ORIGIN_OPTIONS} value={form.origin} onChange={e => setForm(p => ({ ...p, origin: e.target.value as LeadOrigin }))} />
              </div>
              <Textarea label="Observações" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Cancelar</Button>
                <Button type="submit" className="flex-1">Criar Lead</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detalhe do Lead */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-lg font-semibold">{selectedLead.name}</h2>
                <Badge variant={STAGE_BADGE[selectedLead.funnel_stage]} className="mt-1">
                  {LEAD_STAGE_LABELS[selectedLead.funnel_stage]}
                </Badge>
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Informações */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedLead.phone && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone size={14} className="text-gray-400" /> {selectedLead.phone}
                  </div>
                )}
                {selectedLead.estimated_value && (
                  <div className="font-semibold text-green-700">{formatCurrency(selectedLead.estimated_value)}</div>
                )}
                {selectedLead.service && <div className="text-gray-600">{selectedLead.service}</div>}
                {selectedLead.origin && <div className="text-gray-600">{ORIGIN_LABELS[selectedLead.origin as LeadOrigin]}</div>}
                {selectedLead.last_contact && (
                  <div className="flex items-center gap-2 text-gray-500 col-span-2">
                    <Clock size={14} /> Último contato: {formatRelative(selectedLead.last_contact)}
                  </div>
                )}
              </div>
              {selectedLead.notes && (
                <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">{selectedLead.notes}</div>
              )}

              {/* Ações rápidas */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Ações</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="secondary" onClick={() => handleContacted(selectedLead)}>
                    <CheckCircle size={14} /> Contatado
                  </Button>
                  {selectedLead.phone && (
                    <a
                      href={`https://wa.me/55${selectedLead.phone.replace(/\D/g,'')}`}
                      target="_blank" rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-xl hover:bg-green-600 transition-colors"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {/* Mover de estágio */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Mover para</p>
                <div className="flex flex-wrap gap-2">
                  {STAGES.filter(s => s !== selectedLead.funnel_stage).map(stage => (
                    <button
                      key={stage}
                      onClick={() => handleStageChange(selectedLead, stage)}
                      className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-xl hover:bg-brand-50 hover:text-brand-700 transition-colors"
                    >
                      {LEAD_STAGE_LABELS[stage]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botão converter */}
              {selectedLead.funnel_stage !== 'closed' && (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => handleStageChange(selectedLead, 'closed')}
                >
                  <ChevronRight size={16} /> Converter em Venda
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
