'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Production, ProductionStatus, PRODUCTION_STATUS_LABELS } from '@/types'
import { Badge, Card, PageHeader, KpiCard } from '@/components/ui'
import { formatDate, daysRemaining, cn } from '@/lib/utils'
import { Clapperboard, Clock, CheckCircle, MoveRight } from 'lucide-react'
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

export default function ProductionClient({ initialProductions }: { initialProductions: Production[] }) {
  const supabase = createClient()
  const [productions, setProductions] = useState<Production[]>(initialProductions)

  const byStatus = COLUMNS.reduce((acc, col) => {
    acc[col] = productions.filter(p => p.status === col)
    return acc
  }, {} as Record<ProductionStatus, Production[]>)

  async function moveCard(prod: Production, newStatus: ProductionStatus) {
    const updates: Partial<Production> = { status: newStatus }
    if (newStatus === 'in_progress' && !prod.started_at) updates.started_at = new Date().toISOString()
    if (newStatus === 'done') updates.finished_at = new Date().toISOString()

    const { error } = await supabase.from('productions').update(updates).eq('id', prod.id)
    if (error) { toast.error('Erro ao mover card'); return }
    setProductions(prev => prev.map(p => p.id === prod.id ? { ...p, ...updates } : p))
    if (newStatus === 'done') toast.success('Arte finalizada! Pós-venda criado automaticamente.')
    else toast.success('Status atualizado!')
  }

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

      {/* Kanban */}
      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map(col => (
          <div key={col} className={cn('rounded-2xl p-4 min-h-64', COL_BG[col])}>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-gray-700 text-sm">{PRODUCTION_STATUS_LABELS[col]}</h3>
              <span className="bg-white text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                {byStatus[col].length}
              </span>
            </div>

            <div className="space-y-3">
              {byStatus[col].map(prod => {
                const client = (prod as any).client
                const pkg = (prod as any).package
                const daysLeft = pkg?.expires_at ? daysRemaining(pkg.expires_at) : null
                return (
                  <div key={prod.id} className={cn('bg-white rounded-xl p-3 shadow-sm border-t-4', COL_COLORS[col])}>
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

                    {/* Botões de movimentação */}
                    <div className="flex gap-2 mt-3">
                      {col === 'queue' && (
                        <button onClick={() => moveCard(prod, 'in_progress')}
                          className="flex-1 text-xs bg-yellow-50 text-yellow-700 hover:bg-yellow-100 py-1.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-1">
                          <MoveRight size={12}/> Iniciar
                        </button>
                      )}
                      {col === 'in_progress' && (
                        <button onClick={() => moveCard(prod, 'done')}
                          className="flex-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 py-1.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-1">
                          <CheckCircle size={12}/> Finalizar
                        </button>
                      )}
                      {col !== 'queue' && col !== 'done' && (
                        <button onClick={() => moveCard(prod, 'queue')}
                          className="text-xs text-gray-400 hover:text-gray-600 px-2">
                          ← Voltar
                        </button>
                      )}
                      {col === 'done' && prod.finished_at && (
                        <p className="text-xs text-green-600">✓ {formatDate(prod.finished_at)}</p>
                      )}
                    </div>
                  </div>
                )
              })}

              {byStatus[col].length === 0 && (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                  <p className="text-xs text-gray-400">Sem itens</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
