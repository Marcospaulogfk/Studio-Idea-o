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
import { Production, ProductionStatus, PRODUCTION_STATUS_LABELS } from '@/types'
import { PageHeader, KpiCard } from '@/components/ui'
import { formatDate, daysRemaining, cn } from '@/lib/utils'
import { Clapperboard, Clock, CheckCircle, MoveRight, GripVertical, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const COLUMNS: ProductionStatus[] = ['queue', 'in_progress', 'done']
const COL_COLORS: Record<ProductionStatus, string> = {
  queue: 'border-t-gray-400',
  in_progress: 'border-t-yellow-500',
  done: 'border-t-green-500',
}
const COL_BG: Record<ProductionStatus, string> = {
  queue: 'bg-gray-50',
  in_progress: 'bg-yellow-50/30',
  done: 'bg-green-50/30',
}
const COL_RING: Record<ProductionStatus, string> = {
  queue: 'ring-gray-400',
  in_progress: 'ring-yellow-500',
  done: 'ring-green-500',
}

function ProductionCardBody({ prod }: { prod: Production }) {
  const client = (prod as any).client
  const pkg = (prod as any).package
  const daysLeft = pkg?.expires_at ? daysRemaining(pkg.expires_at) : null
  return (
    <>
      <p className="font-semibold text-gray-900 text-sm">{client?.name ?? '—'}</p>
      {prod.title && <p className="text-xs text-gray-500 mt-0.5">{prod.title}</p>}
      {daysLeft !== null && (
        <div className={cn('text-xs mt-2 flex items-center gap-1 font-medium',
          daysLeft <= 7 ? 'text-red-600' : daysLeft <= 15 ? 'text-yellow-600' : 'text-gray-500')}>
          <Clock size={10}/>
          Pacote vence em {daysLeft}d
        </div>
      )}
      {prod.notes && <p className="text-xs text-gray-400 mt-1 italic">{prod.notes}</p>}
    </>
  )
}

function SortableProductionCard({
  prod,
  col,
  onMove,
  onDelete,
}: {
  prod: Production
  col: ProductionStatus
  onMove: (p: Production, status: ProductionStatus) => void
  onDelete: (p: Production) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: prod.id,
    data: { type: 'card', status: prod.status },
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
      className={cn(
        'bg-white dark:bg-neutral-900 rounded-xl p-3 shadow-sm border-t-4 transition-shadow group',
        COL_COLORS[col],
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <ProductionCardBody prod={prod} />
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => onDelete(prod)}
            className="p-1 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
            title="Excluir"
          >
            <Trash2 size={14} />
          </button>
          <button
            {...attributes}
            {...listeners}
            aria-label="Arrastar"
            className="p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical size={16} />
          </button>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        {col === 'queue' && (
          <button onClick={() => onMove(prod, 'in_progress')}
            className="flex-1 text-xs bg-yellow-50 text-yellow-700 hover:bg-yellow-100 py-1.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-1">
            <MoveRight size={12}/> Iniciar
          </button>
        )}
        {col === 'in_progress' && (
          <>
            <button onClick={() => onMove(prod, 'queue')}
              className="text-xs text-gray-400 hover:text-gray-600 px-2">
              ← Voltar
            </button>
            <button onClick={() => onMove(prod, 'done')}
              className="flex-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 py-1.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-1">
              <CheckCircle size={12}/> Finalizar
            </button>
          </>
        )}
        {col === 'done' && prod.finished_at && (
          <p className="text-xs text-green-600">✓ {formatDate(prod.finished_at)}</p>
        )}
      </div>
    </div>
  )
}

function DroppableColumn({
  status,
  children,
  isOver,
  count,
}: {
  status: ProductionStatus
  children: React.ReactNode
  isOver: boolean
  count: number
}) {
  const { setNodeRef } = useDroppable({ id: status, data: { type: 'column' } })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-2xl p-4 min-h-64 transition-all',
        COL_BG[status],
        isOver && cn('ring-2', COL_RING[status]),
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-semibold text-gray-700 text-sm">{PRODUCTION_STATUS_LABELS[status]}</h3>
        <span className="bg-white text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
          {count}
        </span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

export default function ProductionClient({ initialProductions }: { initialProductions: Production[] }) {
  const supabase = createClient()
  const [productions, setProductions] = useState<Production[]>(initialProductions)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const byStatus = useMemo(() => {
    return COLUMNS.reduce((acc, col) => {
      acc[col] = productions
        .filter(p => p.status === col)
        .sort((a, b) => (a.queue_position ?? 0) - (b.queue_position ?? 0))
      return acc
    }, {} as Record<ProductionStatus, Production[]>)
  }, [productions])

  const findColumn = (id: string): ProductionStatus | null => {
    if ((COLUMNS as string[]).includes(id)) return id as ProductionStatus
    return productions.find(p => p.id === id)?.status ?? null
  }

  const overColumn = overId ? findColumn(overId) : null

  async function persistAll(snapshot: Production[]) {
    const updates = snapshot.map(p => {
      const update: any = {
        status: p.status,
        queue_position: p.queue_position ?? 0,
      }
      if (p.status === 'in_progress' && !p.started_at) update.started_at = new Date().toISOString()
      if (p.status === 'done' && !p.finished_at) update.finished_at = new Date().toISOString()
      return { id: p.id, update }
    })

    const results = await Promise.all(
      updates.map(({ id, update }) => supabase.from('productions').update(update).eq('id', id))
    )
    if (results.some(r => r.error)) toast.error('Erro ao salvar posições')
  }

  async function handleDelete(prod: Production) {
    if (!confirm(`Excluir esta produção?`)) return
    const { error } = await supabase.from('productions').delete().eq('id', prod.id)
    if (error) { toast.error('Erro ao excluir'); return }
    setProductions(prev => prev.filter(p => p.id !== prod.id))
    toast.success('Produção excluída')
  }

  async function moveCard(prod: Production, newStatus: ProductionStatus) {
    if (prod.status === newStatus) return
    const updates: Partial<Production> = { status: newStatus }
    if (newStatus === 'in_progress' && !prod.started_at) updates.started_at = new Date().toISOString()
    if (newStatus === 'done') updates.finished_at = new Date().toISOString()

    const next = productions.map(p => p.id === prod.id ? { ...p, ...updates } : p)
    setProductions(next)

    const { error } = await supabase.from('productions').update(updates).eq('id', prod.id)
    if (error) {
      toast.error('Erro ao mover card')
      setProductions(productions)
      return
    }
    if (newStatus === 'done') toast.success('Arte finalizada! Pós-venda criado automaticamente.')
    else toast.success('Status atualizado!')
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

    const activeCol = findColumn(activeIdStr)
    const overCol = findColumn(overIdStr)
    if (!activeCol || !overCol || activeCol === overCol) return

    setProductions(prev => prev.map(p => p.id === activeIdStr ? { ...p, status: overCol } : p))
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    setOverId(null)
    if (!over) return

    const activeIdStr = String(active.id)
    const overIdStr = String(over.id)
    const finalCol = findColumn(activeIdStr)
    if (!finalCol) return

    let snapshot = productions

    if (activeIdStr !== overIdStr && !(COLUMNS as string[]).includes(overIdStr)) {
      const colCards = snapshot
        .filter(p => p.status === finalCol)
        .sort((a, b) => (a.queue_position ?? 0) - (b.queue_position ?? 0))
      const oldIdx = colCards.findIndex(c => c.id === activeIdStr)
      const newIdx = colCards.findIndex(c => c.id === overIdStr)
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        const moved = arrayMove(colCards, oldIdx, newIdx)
        const posMap = new Map(moved.map((c, idx) => [c.id, idx]))
        snapshot = snapshot.map(p =>
          posMap.has(p.id) ? { ...p, queue_position: posMap.get(p.id)! } : p,
        )
      }
    }

    // Renumera todas as colunas pra garantir consistência
    const renumbered = snapshot.map(p => ({ ...p }))
    COLUMNS.forEach(col => {
      const list = renumbered
        .filter(p => p.status === col)
        .sort((a, b) => (a.queue_position ?? 0) - (b.queue_position ?? 0))
      list.forEach((c, idx) => { c.queue_position = idx })
    })

    setProductions(renumbered)
    await persistAll(renumbered)
  }

  function handleDragCancel() {
    setActiveId(null)
    setOverId(null)
  }

  const activeProd = activeId ? productions.find(p => p.id === activeId) : null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produção"
        subtitle={`${byStatus.queue.length} na fila · ${byStatus.in_progress.length} em produção · ${byStatus.done.length} finalizadas`}
      />

      <div className="grid grid-cols-3 gap-4">
        <KpiCard title="Na Fila" value={String(byStatus.queue.length)} icon={<Clock size={20}/>} color="blue"/>
        <KpiCard title="Em Produção" value={String(byStatus.in_progress.length)} icon={<Clapperboard size={20}/>} color="yellow"/>
        <KpiCard title="Finalizadas" value={String(byStatus.done.length)} icon={<CheckCircle size={20}/>} color="green"/>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-3 gap-4">
          {COLUMNS.map(col => (
            <DroppableColumn
              key={col}
              status={col}
              isOver={overColumn === col}
              count={byStatus[col].length}
            >
              <SortableContext
                items={byStatus[col].map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                {byStatus[col].length === 0 && (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                    <p className="text-xs text-gray-400">Solte um card aqui</p>
                  </div>
                )}
                {byStatus[col].map(prod => (
                  <SortableProductionCard key={prod.id} prod={prod} col={col} onMove={moveCard} onDelete={handleDelete} />
                ))}
              </SortableContext>
            </DroppableColumn>
          ))}
        </div>

        <DragOverlay>
          {activeProd && (
            <div className={cn('bg-white rounded-xl p-3 shadow-2xl border-t-4 rotate-2 cursor-grabbing', COL_COLORS[activeProd.status])}>
              <ProductionCardBody prod={activeProd} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
