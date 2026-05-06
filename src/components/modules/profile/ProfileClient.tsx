'use client'

import { useState } from 'react'
import { Card, CardHeader, Button, Input, Badge, PageHeader } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { Save, KeyRound, ShieldCheck, Mail, User as UserIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import type { UserRole } from '@/types'

interface Props {
  initial: { id: string; email: string; name: string; role: UserRole; active: boolean }
}

const ROLE_LABELS: Record<UserRole, string> = { admin: 'Administrador', manager: 'Gerente', operator: 'Operador' }
const ROLE_BADGE: Record<UserRole, 'red' | 'orange' | 'blue'> = { admin: 'red', manager: 'orange', operator: 'blue' }

export default function ProfileClient({ initial }: Props) {
  const supabase = createClient()
  const [name, setName] = useState(initial.name)
  const [savingName, setSavingName] = useState(false)

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || name.trim() === initial.name) return
    setSavingName(true)
    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    setSavingName(false)
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      toast.error(j.error ?? 'Erro ao salvar nome')
      return
    }
    toast.success('Nome atualizado!')
  }

  async function handleChangePwd(e: React.FormEvent) {
    e.preventDefault()
    if (newPwd.length < 6) { toast.error('Senha deve ter ao menos 6 caracteres'); return }
    if (newPwd !== confirmPwd) { toast.error('As senhas não coincidem'); return }

    setSavingPwd(true)
    // Re-autentica antes de trocar (boa prática)
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: initial.email, password: currentPwd,
    })
    if (signInErr) {
      setSavingPwd(false)
      toast.error('Senha atual incorreta')
      return
    }
    const { error } = await supabase.auth.updateUser({ password: newPwd })
    setSavingPwd(false)
    if (error) { toast.error(error.message); return }
    setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
    toast.success('Senha alterada!')
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Meu Perfil" subtitle="Suas informações de acesso e segurança" />

      {/* Identidade */}
      <Card>
        <CardHeader title="Informações" subtitle="Nome exibido no sistema" />
        <form onSubmit={handleSaveName} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nome completo" value={name} onChange={e => setName(e.target.value)} required />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">E-mail</label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-800/40 border border-gray-200 dark:border-neutral-800 rounded-xl text-sm text-gray-600 dark:text-neutral-400">
                <Mail size={14} />
                {initial.email}
              </div>
              <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1">O e-mail não pode ser alterado por aqui</p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Badge variant={ROLE_BADGE[initial.role]}>
              <ShieldCheck size={11} className="-ml-0.5 mr-0.5" /> {ROLE_LABELS[initial.role]}
            </Badge>
            <Badge variant={initial.active ? 'green' : 'gray'}>{initial.active ? 'Ativo' : 'Inativo'}</Badge>
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={savingName} disabled={!name.trim() || name.trim() === initial.name}>
              <Save size={14} /> Salvar nome
            </Button>
          </div>
        </form>
      </Card>

      {/* Segurança */}
      <Card>
        <CardHeader title="Trocar senha" subtitle="Você precisa informar a senha atual" action={<KeyRound size={18} className="text-gray-300 dark:text-neutral-600" />} />
        <form onSubmit={handleChangePwd} className="space-y-4">
          <Input
            label="Senha atual *"
            type="password"
            value={currentPwd}
            onChange={e => setCurrentPwd(e.target.value)}
            required
            autoComplete="current-password"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nova senha *"
              type="password"
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              required
              autoComplete="new-password"
              hint="Mínimo 6 caracteres"
            />
            <Input
              label="Confirmar nova senha *"
              type="password"
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={savingPwd} disabled={!currentPwd || !newPwd || !confirmPwd}>
              <KeyRound size={14} /> Alterar senha
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
