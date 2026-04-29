'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const PALETTE = ['#FF6B00', '#3B82F6', '#10B981', '#A855F7', '#F59E0B', '#EC4899', '#6366F1']

interface ServiceSlice { service: string; count: number }

export function ServicesPieChart({ data }: { data: ServiceSlice[] }) {
  if (!data || data.length === 0) {
    return <p className="text-center text-sm text-gray-400 py-12">Sem dados de serviços ainda</p>
  }

  const top = data.slice(0, 6)
  const total = top.reduce((s, d) => s + d.count, 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-4 items-center">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={top}
              dataKey="count"
              nameKey="service"
              innerRadius={50}
              outerRadius={85}
              paddingAngle={2}
              strokeWidth={0}
            >
              {top.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                fontSize: 12,
                color: 'var(--text)',
              }}
              formatter={(value: number, _name, p) => [`${value} (${Math.round((value/total)*100)}%)`, p.payload.service]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-2 text-sm min-w-[170px]">
        {top.map((s, i) => (
          <li key={s.service} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
            <span className="text-gray-700 dark:text-neutral-300 truncate flex-1">{s.service}</span>
            <span className="text-xs font-semibold text-gray-900 dark:text-neutral-100">{s.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
