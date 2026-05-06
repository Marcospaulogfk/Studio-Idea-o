'use client'

import { useEffect, useRef, useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DateRange = { from: Date | null; to: Date | null }

const PRESETS = [
  { id: 'all',       label: 'Todo período' },
  { id: 'this-month',label: 'Este mês' },
  { id: 'last-month',label: 'Mês passado' },
  { id: 'last-30',   label: 'Últimos 30 dias' },
  { id: 'last-90',   label: 'Últimos 90 dias' },
  { id: 'this-year', label: 'Este ano' },
  { id: 'custom',    label: 'Personalizado' },
] as const

export type PresetId = typeof PRESETS[number]['id']

export function presetToRange(preset: PresetId): DateRange {
  const now = new Date()
  switch (preset) {
    case 'this-month': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from, to: null }
    }
    case 'last-month': {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      return { from, to }
    }
    case 'last-30': return { from: new Date(now.getTime() - 30 * 86400_000), to: null }
    case 'last-90': return { from: new Date(now.getTime() - 90 * 86400_000), to: null }
    case 'this-year': return { from: new Date(now.getFullYear(), 0, 1), to: null }
    case 'all':
    case 'custom':
    default:
      return { from: null, to: null }
  }
}

interface Props {
  preset: PresetId
  range: DateRange
  onChange: (preset: PresetId, range: DateRange) => void
}

export function DateRangeFilter({ preset, range, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const currentLabel = PRESETS.find(p => p.id === preset)?.label ?? 'Período'

  function pickPreset(id: PresetId) {
    if (id === 'custom') {
      onChange('custom', range)
      // mantém o popover aberto para o usuário escolher datas
      return
    }
    onChange(id, presetToRange(id))
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-700 dark:text-neutral-200 hover:border-orange-300 dark:hover:border-orange-500/50 transition-colors"
      >
        <Calendar size={14} className="text-gray-400 dark:text-neutral-500" />
        <span>{currentLabel}</span>
        <ChevronDown size={14} className="text-gray-400 dark:text-neutral-500" />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-72 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl p-2">
          {PRESETS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => pickPreset(p.id)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                preset === p.id
                  ? 'bg-orange-500/10 text-orange-700 dark:text-orange-300 font-medium'
                  : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800/60',
              )}
            >
              {p.label}
            </button>
          ))}

          {preset === 'custom' && (
            <div className="border-t border-gray-100 dark:border-neutral-800 mt-2 pt-2 px-2 pb-2 space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1">De</label>
                <input
                  type="date"
                  value={range.from ? range.from.toISOString().slice(0, 10) : ''}
                  onChange={e => onChange('custom', { from: e.target.value ? new Date(e.target.value) : null, to: range.to })}
                  className="w-full text-xs border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1">Até</label>
                <input
                  type="date"
                  value={range.to ? range.to.toISOString().slice(0, 10) : ''}
                  onChange={e => onChange('custom', { from: range.from, to: e.target.value ? new Date(e.target.value + 'T23:59:59') : null })}
                  className="w-full text-xs border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full mt-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors"
              >
                Aplicar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function inRange(d: Date | string | null | undefined, range: DateRange): boolean {
  if (!d) return false
  const date = typeof d === 'string' ? new Date(d) : d
  if (range.from && date < range.from) return false
  if (range.to && date > range.to) return false
  return true
}
