'use client'

import { useMemo, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/lib/supabase/client'
import { Lead, LeadStage, LEAD_STAGE_LABELS, ORIGIN_LABELS, LeadOrigin, SERVICES } from '@/types'
import { Button, Badge, Input, Select, Textarea, PageHeader } from '@/components/ui'
import { formatCurrency, formatRelative, getFollowupUrgency, cn } from '@/lib/utils'
import { Plus, Phone, Clock, ChevronRight, X, CheckCircle, GripVertical } from 'lucide-react'
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

const STAGE_RING: Record<LeadStage, string> = {
  new: 'ring-blue-400',
  negotiating: 'ring-yellow-400',
  closed: 'ring-green-400',
  disqualified: 'ring-red-400',
  future: 'ring-purple-400',
}

const ORIGIN_OPTIONS = Object.entries(ORIGIN_LABELS).map(([value, label]) => ({ value, label }))
const SERVICE_OPTIONS = SERVICES.map(s => ({ value: s, label: s }))

interface Props { initialLeads: Lead[] }

function urgencyBadge(lead: Lead) {
  const urgency = getFollowupUrgency(lead.last_contact ?? null)
  if (urgency === 'critical') return <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
  if (urgency === 'warning')  return <span className="w-2 h-2 rounded-full bg-yellow-500" />
  return null
}

function LeadCardBody({ lead }: { lead: Lead }) {
  return (
    <>
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
    </>
  )
}

function SortableLeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { type: 'card', stage: lead.funnel_stage },
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={cn(
        'bg-white border-l-4 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer',
        STAGE_COLORS[lead.funnel_stage],
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <LeadCardBody lead={lead} />
        </div>
        <button
          {...attributes}
          {...listeners}
          aria-label="Arrastar"
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none -mt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={16} />
        </button>
      </div>
    </div>
  )
}

function DroppableStageColumn({
  stage,
  isOver,
  count,
  children,
}: {
  stage: LeadStage
  isOver: boolean
  count: number
  children: React.ReactNode
}) {
  const { setNodeRef } = useDroppable({ id: stage, data: { type: 'column' } })
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={STAGE_BADGE[stage]}>{LEAD_STAGE_LABELS[stage]}</Badge>
          <span className="text-xs text-gray-400 font-medium">{count}</span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'space-y-2 min-h-32 rounded-xl p-2 transition-all',
          isOver && cn('ring-2', STAGE_RING[stage], 'bg-white/40'),
        )}
      >
        {children}
      </div>
    </div>
  )
}

export default function LeadsClient({ initialLeads }: Props) {
  const supabase = createClient()
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [showForm, setShowForm] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [filterStage, setFilterStage] = useState<LeadStage | 'all'>('all')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const [form, setForm] = useState({
    name: '', phone: '', service: '', estimated_value: '',
    origin: '' as LeadOrigin | '', notes: ''
  })

  const byStage = useMemo(() => {
    return STAGES.reduce((acc, stage) => {
      acc[stage] = leads
        .filter(l => l.funnel_stage === stage)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      return acc
    }, {} as Record<LeadStage, Lead[]>)
  }, [leads])

  const findStage = (id: string): LeadStage | null => {
    if ((STAGES as string[]).includes(id)) return id as LeadStage
    return leads.find(l => l.id === id)?.funnel_stage ?? null
  }

  const overStage = overId ? findStage(overId) : null

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
      position: 0,
    }).select().single()

    if (error) { toast.error('Erro ao criar lead'); return }
    setLeads(prev => [data, ...prev.map(l => l.funnel_stage === 'new' ? { ...l, position: (l.position ?? 0) + 1 } : l)])
    setForm({ name: '', phone: '', service: '', estimated_value: '', origin: '', notes: '' })
    setShowForm(false)
    toast.success('Lead criado com sucesso!')
  }

  async function handleStageChange(lead: Lead, newStage: LeadStage) {
    if (lead.funnel_stage === newStage) return
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, funnel_stage: newStage } : l))
    if (selectedLead?.id === lead.id) setSelectedLead({ ...lead, funnel_stage: newStage })

    const { error } = await supabase
      .from('leads')
      .update({ funnel_stage: newStage, updated_at: new Date().toISOString() })
      .eq('id', lead.id)

    if (error) {
      toast.error('Erro ao atualizar status')
      setLeads(prev => prev.map(l => l.id === lead.id ? lead : l))
      return
    }
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

  async function persistAll(snapshot: Lead[]) {
    const updates = snapshot.map(l => ({
      id: l.id,
      funnel_stage: l.funnel_stage,
      position: l.position ?? 0,
    }))
    const results = await Promise.all(
      updates.map(u =>
        supabase.from('leads').update({
          funnel_stage: u.funnel_stage,
          position: u.position,
        }).eq('id', u.id),
      ),
    )
    if (results.some(r => r.error)) toast.error('Erro ao salvar posições')
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    setOverId(over ? String(over.id) : null)
    if (!over) return

    const activeIdStr = String(active.id)
    const overIdStr = String(over.id)
    if (activeIdStr === overIdStr) return

    const activeStage = findStage(activeIdStr)
    const overStage = findStage(overIdStr)
    if (!activeStage || !overStage || activeStage === overStage) return

    setLeads(prev => prev.map(l => l.id === activeIdStr ? { ...l, funnel_stage: overStage } : l))
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    setOverId(null)
    if (!over) return

    const activeIdStr = String(active.id)
    const overIdStr = String(over.id)
    const finalStage = findStage(activeIdStr)
    if (!finalStage) return

    let snapshot = leads

    if (activeIdStr !== overIdStr && !(STAGES as string[]).includes(overIdStr)) {
      const stageList = snapshot
        .filter(l => l.funnel_stage === finalStage)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      const oldIdx = stageList.findIndex(l => l.id === activeIdStr)
      const newIdx = stageList.findIndex(l => l.id === overIdStr)
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        const moved = arrayMove(stageList, oldIdx, newIdx)
        const posMap = new Map(moved.map((l, idx) => [l.id, idx]))
        snapshot = snapshot.map(l =>
          posMap.has(l.id) ? { ...l, position: posMap.get(l.id)! } : l,
        )
      }
    }

    const renumbered = snapshot.map(l => ({ ...l }))
    STAGES.forEach(stage => {
      const list = renumbered
        .filter(l => l.funnel_stage === stage)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      list.forEach((l, idx) => { l.position = idx })
    })

    setLeads(renumbered)
    await persistAll(renumbered)
  }

  function handleDragCancel() {
    setActiveId(null)
    setOverId(null)
  }

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null

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

      <div className="flex gap-2 flex-wrap">
        {([['all', 'Todos'], ...STAGES.map(s => [s, LEAD_STAGE_LABELS[s]])] as [string, string][]).map(([stage, label]) => (
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
                ? leads.length
                : leads.filter(l => l.funnel_stage === stage).length}
            </span>
          </button>
        ))}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {STAGES.map(stage => {
            if (filterStage !== 'all' && filterStage !== stage) return null
            const stageLeads = byStage[stage] ?? []
            return (
              <DroppableStageColumn
                key={stage}
                stage={stage}
                isOver={overStage === stage}
                count={stageLeads.length}
              >
                <SortableContext
                  items={stageLeads.map(l => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {stageLeads.length === 0 && (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
                      <p className="text-xs text-gray-400">Solte um lead aqui</p>
                    </div>
                  )}
                  {stageLeads.map(lead => (
                    <SortableLeadCard
                      key={lead.id}
                      lead={lead}
                      onClick={() => setSelectedLead(lead)}
                    />
                  ))}
                </SortableContext>
              </DroppableStageColumn>
            )
          })}
        </div>

        <DragOverlay>
          {activeLead && (
            <div className={cn('bg-white border-l-4 rounded-xl p-3 shadow-2xl rotate-2 cursor-grabbing', STAGE_COLORS[activeLead.funnel_stage])}>
              <LeadCardBody lead={activeLead} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

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
