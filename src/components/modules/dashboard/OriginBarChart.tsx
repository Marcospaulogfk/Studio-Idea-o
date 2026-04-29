'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ORIGIN_LABELS, LeadOrigin } from '@/types'

interface OriginRow { origin: LeadOrigin | string; total_revenue: number }

const fmt = (n: number) => n >= 1000 ? `R$ ${(n/1000).toFixed(1)}k` : `R$ ${n.toFixed(0)}`

export function OriginBarChart({ data }: { data: OriginRow[] }) {
  if (!data || data.length === 0) {
    return <p className="text-center text-sm text-gray-400 py-12">Sem vendas no período</p>
  }

  const rows = data.map(r => ({
    label: ORIGIN_LABELS[r.origin as LeadOrigin] ?? r.origin ?? '—',
    revenue: Number(r.total_revenue) || 0,
  })).sort((a, b) => b.revenue - a.revenue)

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-gray-100 dark:stroke-slate-700" />
          <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} stroke="var(--text-muted)" />
          <YAxis type="category" dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} stroke="var(--text-muted)" width={90} />
          <Tooltip
            cursor={{ fill: 'rgba(255,107,0,0.05)' }}
            contentStyle={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              fontSize: 12,
              color: 'var(--text)',
            }}
            formatter={(v: number) => [fmt(v), 'Receita']}
          />
          <Bar dataKey="revenue" fill="#FF6B00" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
