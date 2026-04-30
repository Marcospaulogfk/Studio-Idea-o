'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Client, Sale, Package, Production, AfterSale, PAYMENT_STATUS_LABELS } from '@/types'
import { Card, CardHeader, KpiCard, Badge, Button, ProgressBar } from '@/components/ui'
import { formatCurrency, formatDate, formatRelative, daysRemaining, getPackageAlertLevel, cn } from '@/lib/utils'
import {
  ArrowLeft, Phone, MapPin, Calendar, ShoppingBag, Package as PackageIcon,
  Clapperboard, Star, TrendingUp, FileText, Mail,
} from 'lucide-react'

interface Props {
  client: Client
  sales: Sale[]
  packages: Package[]
  productions: Production[]
  aftersales: AfterSale[]
}

export default function ClientDetailClient({ client, sales, packages, productions, aftersales }: Props) {
  const ltv = useMemo(() => sales.reduce((s, x) => s + Number(x.total_value || 0), 0), [sales])
  const avgTicket = sales.length > 0 ? ltv / sales.length : 0
  const activePackages = packages.filter(p => p.status === 'active')
  const totalArtsRemaining = activePackages.reduce((s, p) => s + (p.arts_total - p.arts_used), 0)
  const npsScores = aftersales.filter(a => a.nps_score).map(a => a.nps_score as number)
  const avgNps = npsScores.length > 0 ? npsScores.reduce((s, x) => s + x, 0) / npsScores.length : 0

  const initials = client.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="space-y-6">
      {/* Voltar */}
      <Link href="/clients" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-neutral-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
        <ArrowLeft size={14} /> Voltar para Clientes
      </Link>

      {/* Hero */}
      <Card className="bg-gradient-to-br from-white to-orange-50/30 dark:from-neutral-900 dark:to-orange-500/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-500 rounded-2xl flex items-center justify-center shadow-orange-glow shrink-0">
            <span className="text-white font-extrabold text-2xl sm:text-3xl tracking-tight">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-neutral-100">{client.name}</h1>
              <Badge variant={client.status === 'active' ? 'green' : 'gray'}>
                {client.status === 'active' ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-gray-600 dark:text-neutral-400">
              {client.phone && (
                <a href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  <Phone size={14} /> {client.phone}
                </a>
              )}
              {client.cpf_cnpj && (
                <span className="flex items-center gap-1.5">
                  <FileText size={14} /> {client.cpf_cnpj}
                </span>
              )}
              {client.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} /> {client.address}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar size={14} /> Cliente desde {formatDate(client.created_at)}
              </span>
            </div>
          </div>
          {client.phone && (
            <a href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white text-sm font-medium rounded-xl hover:bg-green-600 transition-colors shrink-0">
              <Mail size={16} /> WhatsApp
            </a>
          )}
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="LTV Total" value={formatCurrency(ltv)} icon={<TrendingUp size={20}/>} color="green" subtitle={`${sales.length} venda${sales.length !== 1 ? 's' : ''}`} />
        <KpiCard title="Ticket Médio" value={formatCurrency(avgTicket)} icon={<ShoppingBag size={20}/>} color="blue" />
        <KpiCard title="Pacotes Ativos" value={String(activePackages.length)} subtitle={`${totalArtsRemaining} artes restantes`} icon={<PackageIcon size={20}/>} color="orange" />
        <KpiCard title="NPS Médio" value={avgNps > 0 ? avgNps.toFixed(1) : '—'} subtitle={`${npsScores.length} avaliação${npsScores.length !== 1 ? 'ões' : ''}`} icon={<Star size={20}/>} color="purple" />
      </div>

      {/* Vendas */}
      <Card>
        <CardHeader title="Histórico de Vendas" subtitle={`${sales.length} venda${sales.length !== 1 ? 's' : ''}`} />
        {sales.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Nenhuma venda registrada ainda</p>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full">
              <thead>
                <tr className="border-y border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-950/50">
                  <th className="text-left px-6 py-2.5 text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase">Data</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase">Serviços</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase">Valor</th>
                  <th className="text-right px-6 py-2.5 text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase">Pagamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-neutral-800">
                {sales.map(s => (
                  <tr key={s.id} className="hover:bg-orange-500/5 transition-colors">
                    <td className="px-6 py-3 text-xs text-gray-500 dark:text-neutral-400">{formatDate(s.sold_at)}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {s.services?.slice(0, 3).map(svc => (
                          <span key={svc} className="text-xs bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full">{svc}</span>
                        ))}
                        {s.services && s.services.length > 3 && <span className="text-xs text-gray-400">+{s.services.length - 3}</span>}
                      </div>
                      {s.description && <p className="text-xs text-gray-400 mt-1 truncate max-w-xs">{s.description}</p>}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-bold text-gray-900 dark:text-neutral-100">{formatCurrency(s.total_value)}</td>
                    <td className="px-6 py-3 text-right">
                      <Badge variant={s.payment_status === '100%' ? 'green' : s.payment_status === '50%' ? 'blue' : 'yellow'}>
                        {PAYMENT_STATUS_LABELS[s.payment_status]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pacotes */}
        <Card>
          <CardHeader title="Pacotes" subtitle={`${activePackages.length} ativo${activePackages.length !== 1 ? 's' : ''} de ${packages.length}`} />
          {packages.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhum pacote registrado</p>
          ) : (
            <div className="space-y-3">
              {packages.map(pkg => {
                const days = daysRemaining(pkg.expires_at)
                const level = getPackageAlertLevel(days)
                return (
                  <div key={pkg.id} className={cn(
                    'rounded-xl border-l-4 p-3 bg-gray-50/50 dark:bg-neutral-950/50',
                    pkg.status === 'expired' || level === 'critical' ? 'border-l-red-500' :
                    level === 'warning' ? 'border-l-yellow-500' : 'border-l-green-500',
                  )}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-neutral-100">
                          {pkg.model === 'custom' ? 'Personalizado' : `Pacote ${pkg.model} artes`}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-neutral-400">
                          Ativado em {formatDate(pkg.activated_at)} · Vence {formatDate(pkg.expires_at)}
                        </p>
                      </div>
                      <Badge variant={pkg.status === 'active' ? 'green' : pkg.status === 'expired' ? 'red' : 'gray'}>
                        {pkg.status === 'active' ? 'Ativo' : pkg.status === 'expired' ? 'Expirado' : 'Finalizado'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-neutral-400 mb-1">
                      <span>{pkg.arts_used}/{pkg.arts_total} artes</span>
                      {pkg.status === 'active' && days > 0 && (
                        <span className={cn(level === 'critical' ? 'text-red-600' : level === 'warning' ? 'text-yellow-600' : '')}>
                          {days} dias restantes
                        </span>
                      )}
                    </div>
                    <ProgressBar value={pkg.arts_used} max={pkg.arts_total} />
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Produções */}
        <Card>
          <CardHeader title="Produções" subtitle={`${productions.length} no histórico`} />
          {productions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhuma produção registrada</p>
          ) : (
            <div className="space-y-2">
              {productions.slice(0, 8).map(p => (
                <div key={p.id} className="flex items-start justify-between gap-3 p-2.5 -mx-2 rounded-lg hover:bg-orange-500/5 transition-colors">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <Clapperboard size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-neutral-200 truncate">{p.title ?? 'Sem título'}</p>
                      <p className="text-xs text-gray-400">{formatRelative(p.created_at)}</p>
                    </div>
                  </div>
                  <Badge variant={p.status === 'done' ? 'green' : p.status === 'in_progress' ? 'yellow' : 'gray'} className="shrink-0">
                    {p.status === 'done' ? 'Finalizado' : p.status === 'in_progress' ? 'Em produção' : 'Fila'}
                  </Badge>
                </div>
              ))}
              {productions.length > 8 && (
                <p className="text-xs text-gray-400 text-center pt-2">+ {productions.length - 8} mais</p>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Pós-vendas */}
      {aftersales.length > 0 && (
        <Card>
          <CardHeader title="Pós-vendas" subtitle={`${aftersales.filter(a => a.contacted).length} contatado${aftersales.filter(a => a.contacted).length !== 1 ? 's' : ''} de ${aftersales.length}`} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {aftersales.map(a => (
              <div key={a.id} className="rounded-xl border border-gray-100 dark:border-neutral-800 p-3 bg-gray-50/50 dark:bg-neutral-950/50">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={a.contacted ? 'green' : 'yellow'} pulse={!a.contacted}>
                    {a.contacted ? 'Contatado' : 'Pendente'}
                  </Badge>
                  <span className="text-xs text-gray-400">{formatRelative(a.created_at)}</span>
                </div>
                {a.nps_score && (
                  <div className="flex items-center gap-1 mb-1.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={12} className={s <= (a.nps_score ?? 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 dark:text-neutral-700'} />
                    ))}
                    <span className="text-xs text-gray-500 dark:text-neutral-400 ml-1">{a.nps_score}/5</span>
                  </div>
                )}
                {a.feedback && <p className="text-xs text-gray-600 dark:text-neutral-300 italic line-clamp-2">"{a.feedback}"</p>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
