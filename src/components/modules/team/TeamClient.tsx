'use client'

import { useState } from 'react'
import { Button, Badge, Card, Input, Select, PageHeader, EmptyState, KpiCard } from '@/components/ui'
import { formatDate, cn } from '@/lib/utils'
import { Plus, X, UserPlus, Mail, Shield, ShieldCheck, User as UserIcon, Power, Trash2, Send, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import type { UserRole } from '@/types'

interface Member {
  id: string
  email: string
  name: string
  role: UserRole
  active: boolean
  created_at: string
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  operator: 'Operador',
}

const ROLE_BADGE: Record<UserRole, 'red' | 'orange' | 'blue'> = {
  admin: 'red',
  manager: 'orange',
  operator: 'blue',
}

const ROLE_ICON: Record<UserRole, typeof Shield> = {
  admin: ShieldCheck,
  manager: Shield,
  operator: UserIcon,
}

interface Props {
  initial: Member[]
  currentUserRole: UserRole
  currentUserId: string
}

export default function TeamClient({ initial, currentUserRole, currentUserId }: Props) {
  const [members, setMembers] = useState<Member[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'operator' as UserRole,
  })

  const isAdmin = currentUserRole === 'admin'

  // Apenas admin pode criar/editar admins. Manager só pode operator/manager.
  const ROLE_OPTIONS = (isAdmin
    ? [{ value: 'admin', label: 'Administrador' }, { value: 'manager', label: 'Gerente' }, { value: 'operator', label: 'Operador' }]
    : [{ value: 'manager', label: 'Gerente' }, { value: 'operator', label: 'Operador' }])

  const activeCount = members.filter(m => m.active).length
  const adminCount = members.filter(m => m.role === 'admin').length
  const operatorCount = members.filter(m => m.role === 'operator').length

  function resetForm() {
    setForm({ name: '', email: '', role: 'operator' })
    setShowForm(false)
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Nome e e-mail são obrigatórios')
      return
    }
    setSubmitting(true)
    const res = await fetch('/api/team/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      toast.error(json.error ?? 'Erro ao enviar convite')
      return
    }

    setMembers(prev => [json.user, ...prev])
    toast.success(`Convite enviado para ${form.email}`)
    resetForm()
  }

  async function handleResend(member: Member) {
    const res = await fetch('/api/team/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: member.name, email: member.email, role: member.role, resend: true }),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error ?? 'Erro ao reenviar convite')
      return
    }
    toast.success(`Convite reenviado para ${member.email}`)
  }

  async function handleToggleActive(member: Member) {
    if (member.id === currentUserId) {
      toast.error('Você não pode desativar sua própria conta')
      return
    }
    const res = await fetch(`/api/team/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !member.active }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      toast.error(j.error ?? 'Erro ao atualizar')
      return
    }
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, active: !m.active } : m))
    toast.success(member.active ? 'Colaborador desativado' : 'Colaborador reativado')
  }

  async function handleChangeRole(member: Member, newRole: UserRole) {
    if (member.id === currentUserId) {
      toast.error('Você não pode alterar seu próprio cargo')
      return
    }
    if (!isAdmin && newRole === 'admin') {
      toast.error('Apenas admins podem promover a admin')
      return
    }
    const res = await fetch(`/api/team/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      toast.error(j.error ?? 'Erro ao atualizar cargo')
      return
    }
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: newRole } : m))
    toast.success('Cargo atualizado')
  }

  async function handleDelete(member: Member) {
    if (member.id === currentUserId) {
      toast.error('Você não pode excluir sua própria conta')
      return
    }
    if (!confirm(`Excluir ${member.name} (${member.email})? Essa ação remove a conta de acesso permanentemente.`)) return
    const res = await fetch(`/api/team/${member.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      toast.error(j.error ?? 'Erro ao excluir')
      return
    }
    setMembers(prev => prev.filter(m => m.id !== member.id))
    toast.success('Colaborador removido')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipe"
        subtitle={`${activeCount} colaborador${activeCount !== 1 ? 'es' : ''} ativo${activeCount !== 1 ? 's' : ''}`}
        action={
          <Button onClick={() => setShowForm(true)}>
            <UserPlus size={16} /> Adicionar Colaborador
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total" value={String(members.length)} icon={<UserIcon size={20} />} color="blue" />
        <KpiCard title="Ativos" value={String(activeCount)} icon={<UserPlus size={20} />} color="green" />
        <KpiCard title="Administradores" value={String(adminCount)} icon={<ShieldCheck size={20} />} color="red" />
        <KpiCard title="Operadores" value={String(operatorCount)} icon={<UserIcon size={20} />} color="purple" />
      </div>

      <Card className="p-0 overflow-hidden">
        {members.length === 0 ? (
          <EmptyState
            icon={<UserIcon size={24} />}
            title="Nenhum colaborador cadastrado"
            description="Clique em Adicionar Colaborador para enviar o primeiro convite"
            action={<Button onClick={() => setShowForm(true)}><UserPlus size={14} /> Adicionar</Button>}
          />
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-neutral-800">
            {members.map(m => {
              const Icon = ROLE_ICON[m.role]
              const isSelf = m.id === currentUserId
              return (
                <div key={m.id} className="flex items-center justify-between gap-3 px-6 py-4 hover:bg-orange-500/5 transition-colors group">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      m.role === 'admin'   ? 'bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400' :
                      m.role === 'manager' ? 'bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400' :
                                             'bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400'
                    )}>
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-gray-900 dark:text-neutral-100 truncate">{m.name}</p>
                        {isSelf && <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-neutral-500">Você</span>}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-neutral-400 truncate flex items-center gap-1">
                        <Mail size={11} /> {m.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-gray-400 dark:text-neutral-500 hidden md:inline">
                      desde {formatDate(m.created_at)}
                    </span>
                    <Badge variant={ROLE_BADGE[m.role]}>{ROLE_LABELS[m.role]}</Badge>
                    <Badge variant={m.active ? 'green' : 'gray'}>{m.active ? 'Ativo' : 'Inativo'}</Badge>

                    {!isSelf && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <select
                          value={m.role}
                          onChange={(e) => handleChangeRole(m, e.target.value as UserRole)}
                          className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-700 dark:text-neutral-200"
                          title="Alterar cargo"
                        >
                          {(isAdmin
                            ? ['admin', 'manager', 'operator']
                            : (m.role === 'admin' ? ['admin'] : ['manager', 'operator'])
                          ).map(r => (
                            <option key={r} value={r}>{ROLE_LABELS[r as UserRole]}</option>
                          ))}
                        </select>

                        <button
                          onClick={() => handleResend(m)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors"
                          title="Reenviar convite"
                        >
                          <Send size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(m)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 transition-colors"
                          title={m.active ? 'Desativar' : 'Reativar'}
                        >
                          <Power size={14} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(m)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Modal de convite */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-neutral-800">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">Adicionar Colaborador</h2>
                <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Um e-mail será enviado com link para definir a senha</p>
              </div>
              <button onClick={resetForm}><X size={20} className="text-gray-400 dark:text-neutral-500" /></button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              <Input label="Nome completo *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Ex: Marcos Silva" />
              <Input label="E-mail *" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value.trim() }))} required placeholder="colaborador@email.com" />
              <Select label="Cargo *" options={ROLE_OPTIONS} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as UserRole }))} required />
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">Cancelar</Button>
                <Button type="submit" loading={submitting} className="flex-1">
                  <Send size={14} /> Enviar convite
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
