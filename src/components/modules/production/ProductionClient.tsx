'use client'
import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { createClient } from '@/lib/supabase/client'
import { Production, ProductionStatus, PRODUCTION_STATUS_LABELS } from '@/types'
import { Badge, Card, PageHeader, KpiCard } from '@/components/ui'
import { formatDate, daysRemaining, cn } from '@/lib/utils'
import { Clapperboard, Clock, CheckCircle, MoveRight, GripVertical } from 'lucide-react'
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

function ProductionCardBody({ prod, dragHandleProps }: { prod: Production; dragHandleProps?: any }) {
  const client = (prod as any).client
  const pkg = (prod as any).package
  const daysLeft = pkg?.expires_at ? daysRemaining(pkg.expires_at) : null
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{client?.name ?? '—'}</p>
          {prod.title && <p className="text-xs text-gray-500 mt-0.5">{prod.title}</p>}
        </div>
        <button
          {...dragHandleProps}
          aria-label="Arrastar"
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={16} />
        </button>
      </div>
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

function DraggableProductionCard({
  prod,
  col,
  onMove,
}: {
  prod: Production
  col: ProductionStatus
  onMove: (p: Production, status: ProductionStatus) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: prod.id,
    data: { status: prod.status },
  })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white rounded-xl p-3 shadow-sm border-t-4 transition-shadow',
        COL_COLORS[col],
        isDragging && 'opacity-40 ring-2 ring-brand-400',
      )}
    >
      <ProductionCardBody prod={prod} dragHandleProps={{ ...listeners, ...attributes }} />
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
}: {
  status: ProductionStatus
  children: React.ReactNode
  isOver: boolean
}) {
  const { setNodeRef } = useDroppable({ id: status })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-2xl p-4 min-h-64 transition-all',
        COL_BG[status],
        isOver && cn('ring-2', COL_RING[status]),
      )}
    >
      {children}
    </div>
  )
}

export default function ProductionClient({ initialProductions }: { initialProductions: Production[] }) {
  const supabase = createClient()
  const [productions, setProductions] = useState<Production[]>(initialProductions)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overColumn, setOverColumn] = useState<ProductionStatus | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const byStatus = COLUMNS.reduce((acc, col) => {
    acc[col] = productions.filter(p => p.status === col)
    return acc
  }, {} as Record<ProductionStatus, Production[]>)

  async function moveCard(prod: Production, newStatus: ProductionStatus) {
    if (prod.status === newStatus) return
    const updates: Partial<Production> = { status: newStatus }
    if (newStatus === 'in_progress' && !prod.started_at) updates.started_at = new Date().toISOString()
    if (newStatus === 'done') updates.finished_at = new Date().toISOString()

    setProductions(prev => prev.map(p => p.id === prod.id ? { ...p, ...updates } : p))

    const { error } = await supabase.from('productions').update(updates).eq('id', prod.id)
    if (error) {
      toast.error('Erro ao mover card')
      setProductions(prev => prev.map(p => p.id === prod.id ? prod : p))
      return
    }
    if (newStatus === 'done') toast.success('Arte finalizada! Pós-venda criado automaticamente.')
    else toast.success('Status atualizado!')
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    setOverColumn(null)
    const { active, over } = event
    if (!over) return
    const newStatus = over.id as ProductionStatus
    const prod = productions.find(p => p.id === active.id)
    if (!prod) return
    moveCard(prod, newStatus)
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
        onDragStart={handleDragStart}
        onDragOver={(e) => setOverColumn(e.over ? (e.over.id as ProductionStatus) : null)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => { setActiveId(null); setOverColumn(null) }}
      >
        <div className="grid grid-cols-3 gap-4">
          {COLUMNS.map(col => (
            <DroppableColumn key={col} status={col} isOver={overColumn === col}>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="font-semibold text-gray-700 text-sm">{PRODUCTION_STATUS_LABELS[col]}</h3>
                <span className="bg-white text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {byStatus[col].length}
                </span>
              </div>
              <div className="space-y-3">
                {byStatus[col].map(prod => (
                  <DraggableProductionCard key={prod.id} prod={prod} col={col} onMove={moveCard} />
                ))}
                {byStatus[col].length === 0 && (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                    <p className="text-xs text-gray-400">Solte um card aqui</p>
                  </div>
                )}
              </div>
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
