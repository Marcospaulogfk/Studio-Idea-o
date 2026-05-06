'use client'

import { useMemo, useState } from 'react'
import { Card, PageHeader, Badge, EmptyState } from '@/components/ui'
import { DateRangeFilter, inRange, type DateRange, type PresetId } from '@/components/ui/date-range'
import { formatDateTime, cn } from '@/lib/utils'
import { History, ChevronDown, ChevronRight as ChevronR } from 'lucide-react'

interface AuditLog {
  id: string
  table_name: string
  row_id: string | null
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  old_data: any
  new_data: any
  changed_by: string | null
  changed_email: string | null
  changed_at: string
}

const ACTION_BADGE: Record<AuditLog['action'], 'green' | 'blue' | 'red'> = {
  INSERT: 'green', UPDATE: 'blue', DELETE: 'red',
}

const TABLE_LABEL: Record<string, string> = {
  leads:        'Leads',
  clients:      'Clientes',
  sales:        'Vendas',
  financials:   'Financeiro',
  users:        'Usuários',
  packages:     'Pacotes',
  productions:  'Produções',
}

function diffFields(o: any, n: any): string[] {
  if (!o || !n) return []
  const keys = Array.from(new Set([...Object.keys(o), ...Object.keys(n)]))
  return keys.filter(k => JSON.stringify(o[k]) !== JSON.stringify(n[k]) && k !== 'updated_at')
}

export default function AuditClient({ initial }: { initial: AuditLog[] }) {
  const [logs] = useState<AuditLog[]>(initial)
  const [filterTable, setFilterTable] = useState<string>('all')
  const [filterAction, setFilterAction] = useState<'all' | AuditLog['action']>('all')
  const [datePreset, setDatePreset] = useState<PresetId>('all')
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null })
  const [openId, setOpenId] = useState<string | null>(null)

  const tables = useMemo(() => Array.from(new Set(logs.map(l => l.table_name))).sort(), [logs])

  const filtered = useMemo(() => logs.filter(l => {
    if (filterTable !== 'all' && l.table_name !== filterTable) return false
    if (filterAction !== 'all' && l.action !== filterAction) return false
    if (datePreset !== 'all' && !inRange(l.changed_at, dateRange)) return false
    return true
  }), [logs, filterTable, filterAction, datePreset, dateRange])

  return (
    <div className="space-y-6">
      <PageHeader title="Auditoria" subtitle={`${filtered.length} de ${logs.length} eventos · últimos 200 registros`} />

      <div className="flex gap-2 flex-wrap items-center">
        <DateRangeFilter preset={datePreset} range={dateRange} onChange={(p, r) => { setDatePreset(p); setDateRange(r) }} />

        <select
          value={filterTable}
          onChange={e => setFilterTable(e.target.value)}
          className="px-3.5 py-2 rounded-xl text-sm border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-700 dark:text-neutral-200"
        >
          <option value="all">Todas as entidades</option>
          {tables.map(t => <option key={t} value={t}>{TABLE_LABEL[t] ?? t}</option>)}
        </select>

        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value as any)}
          className="px-3.5 py-2 rounded-xl text-sm border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-700 dark:text-neutral-200"
        >
          <option value="all">Todas as ações</option>
          <option value="INSERT">Criados</option>
          <option value="UPDATE">Editados</option>
          <option value="DELETE">Excluídos</option>
        </select>
      </div>

      <Card className="p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={<History size={24} />} title="Sem registros" description="Quando alguém criar, editar ou excluir algo crítico, vai aparecer aqui." />
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-neutral-800">
            {filtered.map(log => {
              const isOpen = openId === log.id
              const diffs = log.action === 'UPDATE' ? diffFields(log.old_data, log.new_data) : []
              return (
                <div key={log.id}>
                  <button
                    onClick={() => setOpenId(isOpen ? null : log.id)}
                    className="w-full flex items-center justify-between gap-3 px-6 py-4 hover:bg-orange-500/5 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {isOpen ? <ChevronDown size={14} className="text-gray-400 dark:text-neutral-500 shrink-0" /> : <ChevronR size={14} className="text-gray-400 dark:text-neutral-500 shrink-0" />}
                      <Badge variant={ACTION_BADGE[log.action]}>
                        {log.action === 'INSERT' ? 'Criou' : log.action === 'UPDATE' ? 'Editou' : 'Excluiu'}
                      </Badge>
                      <span className="text-sm font-medium text-gray-800 dark:text-neutral-200">{TABLE_LABEL[log.table_name] ?? log.table_name}</span>
                      <span className="text-xs text-gray-400 dark:text-neutral-500 truncate hidden md:inline">
                        {log.action === 'UPDATE' && diffs.length > 0 ? `${diffs.length} campo${diffs.length>1?'s':''}: ${diffs.slice(0,3).join(', ')}${diffs.length>3?'…':''}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-gray-500 dark:text-neutral-400 truncate hidden sm:inline">{log.changed_email ?? '—'}</span>
                      <span className="text-xs text-gray-400 dark:text-neutral-500">{formatDateTime(log.changed_at)}</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-4 bg-gray-50/60 dark:bg-neutral-950/40 border-t border-gray-100 dark:border-neutral-800">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                        {log.old_data && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase mb-1">Antes</p>
                            <pre className={cn(
                              'text-[11px] p-3 rounded-lg overflow-x-auto bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 text-gray-700 dark:text-neutral-300',
                            )}>
                              {JSON.stringify(log.old_data, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.new_data && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase mb-1">Depois</p>
                            <pre className="text-[11px] p-3 rounded-lg overflow-x-auto bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 text-gray-700 dark:text-neutral-300">
                              {JSON.stringify(log.new_data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
