'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Notification, NotificationType } from '@/types'
import { Card, PageHeader, KpiCard, Button, EmptyState, Badge } from '@/components/ui'
import { formatRelative, cn } from '@/lib/utils'
import {
  Bell, Phone, Package, DollarSign, CheckCircle, AlertTriangle,
  CheckCheck, Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Props { initial: Notification[] }

const TYPE_CONFIG: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  followup_overdue:        { icon: Phone,         color: 'text-red-500',    bg: 'bg-red-500/10' },
  package_expiring_15:     { icon: Package,       color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  package_expiring_7:      { icon: AlertTriangle, color: 'text-red-500',    bg: 'bg-red-500/10' },
  package_expired:         { icon: Package,       color: 'text-gray-500',   bg: 'bg-gray-500/10' },
  sale_pending_payment:    { icon: DollarSign,    color: 'text-yellow-600', bg: 'bg-yellow-500/10' },
  production_done:         { icon: CheckCircle,   color: 'text-green-500',  bg: 'bg-green-500/10' },
}

const TYPE_LABELS: Record<NotificationType, string> = {
  followup_overdue:     'Follow-up vencido',
  package_expiring_15:  'Pacote vence em 15 dias',
  package_expiring_7:   'Pacote vence em 7 dias',
  package_expired:      'Pacote expirado',
  sale_pending_payment: 'Pagamento pendente',
  production_done:      'Produção finalizada',
}

function bucketByDate(notifications: Notification[]) {
  const today: Notification[] = []
  const yesterday: Notification[] = []
  const week: Notification[] = []
  const older: Notification[] = []
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart.getTime() - 86400_000)
  const weekStart = new Date(todayStart.getTime() - 7 * 86400_000)

  for (const n of notifications) {
    const d = new Date(n.created_at)
    if (d >= todayStart) today.push(n)
    else if (d >= yesterdayStart) yesterday.push(n)
    else if (d >= weekStart) week.push(n)
    else older.push(n)
  }
  return { today, yesterday, week, older }
}

export default function NotificationsClient({ initial }: Props) {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>(initial)

  const unread = useMemo(() => notifications.filter(n => !n.read), [notifications])
  const buckets = useMemo(() => bucketByDate(notifications), [notifications])

  async function markAsRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id)
    if (error) toast.error('Erro ao marcar como lida')
  }

  async function markAllRead() {
    if (unread.length === 0) return
    const ids = unread.map(n => n.id)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    const { error } = await supabase.from('notifications').update({ read: true }).in('id', ids)
    if (error) toast.error('Erro ao marcar todas como lidas')
    else toast.success(`${ids.length} notificações marcadas como lidas`)
  }

  async function deleteNotification(id: string) {
    setNotifications(prev => prev.filter(n => n.id !== id))
    const { error } = await supabase.from('notifications').delete().eq('id', id)
    if (error) {
      toast.error('Erro ao deletar')
      // restaura — opcional, mas mais seguro
    }
  }

  async function clearAllRead() {
    const readIds = notifications.filter(n => n.read).map(n => n.id)
    if (readIds.length === 0) { toast('Nada para limpar'); return }
    if (!confirm(`Apagar ${readIds.length} notificações lidas?`)) return
    setNotifications(prev => prev.filter(n => !n.read))
    const { error } = await supabase.from('notifications').delete().in('id', readIds)
    if (error) toast.error('Erro ao limpar')
    else toast.success(`${readIds.length} notificações apagadas`)
  }

  const renderNotification = (n: Notification) => {
    const cfg = TYPE_CONFIG[n.type] ?? { icon: Bell, color: 'text-gray-500', bg: 'bg-gray-500/10' }
    const Icon = cfg.icon
    return (
      <div
        key={n.id}
        className={cn(
          'flex items-start gap-3 p-4 rounded-xl border transition-all group',
          n.read
            ? 'bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800'
            : 'bg-orange-50/50 dark:bg-orange-500/5 border-orange-200 dark:border-orange-500/20',
        )}
      >
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', cfg.bg)}>
          <Icon size={18} className={cfg.color} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={cn(
              'text-sm leading-tight',
              n.read ? 'font-medium text-gray-700 dark:text-neutral-300' : 'font-semibold text-gray-900 dark:text-neutral-100',
            )}>
              {n.title}
            </h3>
            {!n.read && <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 animate-soft-pulse" />}
          </div>
          {n.message && (
            <p className="text-xs text-gray-600 dark:text-neutral-400 leading-relaxed">{n.message}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="gray" className="text-[10px]">{TYPE_LABELS[n.type] ?? n.type}</Badge>
            <span className="text-xs text-gray-400 dark:text-neutral-500">{formatRelative(n.created_at)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {!n.read && (
            <button
              onClick={() => markAsRead(n.id)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors"
              title="Marcar como lida"
            >
              <CheckCheck size={14} />
            </button>
          )}
          <button
            onClick={() => deleteNotification(n.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            title="Apagar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    )
  }

  const renderBucket = (label: string, items: Notification[]) => {
    if (items.length === 0) return null
    return (
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider px-1">{label}</h2>
        <div className="space-y-2">{items.map(renderNotification)}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notificações"
        subtitle={`${unread.length} não lida${unread.length !== 1 ? 's' : ''}`}
        action={
          <div className="flex gap-2">
            {unread.length > 0 && (
              <Button variant="secondary" size="sm" onClick={markAllRead}>
                <CheckCheck size={14} /> Marcar todas como lidas
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={clearAllRead}>
              <Trash2 size={14} /> Limpar lidas
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total" value={String(notifications.length)} icon={<Bell size={20}/>} color="orange" />
        <KpiCard title="Não Lidas" value={String(unread.length)} icon={<AlertTriangle size={20}/>} color="red" />
        <KpiCard title="Pacotes Vencendo"
          value={String(notifications.filter(n => n.type.startsWith('package_expiring')).length)}
          icon={<Package size={20}/>} color="yellow" />
        <KpiCard title="Follow-ups"
          value={String(notifications.filter(n => n.type === 'followup_overdue').length)}
          icon={<Phone size={20}/>} color="blue" />
      </div>

      {notifications.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Bell size={24}/>}
            title="Sem notificações"
            description="Quando algo importante acontecer (pacote expirando, follow-up atrasado, produção finalizada), você verá aqui."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {renderBucket('Hoje', buckets.today)}
          {renderBucket('Ontem', buckets.yesterday)}
          {renderBucket('Esta semana', buckets.week)}
          {renderBucket('Mais antigas', buckets.older)}
        </div>
      )}
    </div>
  )
}
