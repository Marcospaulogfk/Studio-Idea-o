'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, CheckCircle, Mail, AlertCircle, ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/logo'

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
      {children}
    </div>
  )
}

export default function UpdatePasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  // Estado da sessão (carregado do server-side via cookies já criados pelo /auth/callback)
  const [sessionUser, setSessionUser] = useState<{ email: string; name: string } | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)

  // Form
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  // Verifica se há sessão ativa (vinda do /auth/callback após clicar no link do e-mail)
  useEffect(() => {
    let cancelled = false
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user?.email) {
        setSessionExpired(true)
        setSessionChecked(true)
        return
      }
      const metaName = (user.user_metadata?.name as string | undefined) ?? ''
      setSessionUser({ email: user.email, name: metaName })
      setName(metaName)
      setSessionChecked(true)
    }
    check()
    return () => { cancelled = true }
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Informe seu nome completo.')
      return
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    // Atualiza senha + nome no auth metadata
    const { error: authErr } = await supabase.auth.updateUser({
      password,
      data: { name: trimmedName },
    })

    if (authErr) {
      setError('Erro ao salvar. Tente novamente.')
      setLoading(false)
      return
    }

    // Ativa colaborador no public.users (active=true) e sincroniza nome
    await fetch('/api/auth/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmedName }),
    }).catch(() => {})

    setDone(true)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  // ── Tela de sucesso ────────────────────────────────────────────────────────
  if (done) {
    return (
      <AuthShell>
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center relative">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Tudo pronto!</h2>
          <p className="text-gray-500 mt-2 text-sm">Redirecionando para o sistema...</p>
        </div>
      </AuthShell>
    )
  }

  // ── Loading inicial ────────────────────────────────────────────────────────
  if (!sessionChecked) {
    return (
      <AuthShell>
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center relative">
          <Loader2 size={32} className="animate-spin text-orange-500 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Validando seu link...</p>
        </div>
      </AuthShell>
    )
  }

  // ── Sessão inválida (link expirado, já usado ou inválido) ──────────────────
  if (sessionExpired) {
    return (
      <AuthShell>
        <div className="w-full max-w-md relative">
          <div className="text-center mb-8">
            <Logo bg="dark" height={48} priority className="mx-auto mb-3" />
          </div>
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Link inválido ou expirado</h2>
            <p className="text-gray-500 mt-2 text-sm leading-relaxed">
              Este link pode já ter sido usado, ou expirou. Peça ao administrador para enviar um novo convite, ou clique abaixo para solicitar a recuperação de senha.
            </p>
            <div className="mt-6 space-y-2">
              <Link
                href="/auth/reset-password"
                className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-xl transition-all"
              >
                Recuperar senha
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mt-2"
              >
                <ArrowLeft size={14} /> Voltar para o login
              </Link>
            </div>
          </div>
        </div>
      </AuthShell>
    )
  }

  // ── Formulário de cadastro/primeiro acesso ─────────────────────────────────
  return (
    <AuthShell>
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <Logo bg="dark" height={48} priority className="mx-auto mb-3" />
          <p className="text-orange-200/80 text-xs tracking-widest uppercase">Bem-vindo · Primeiro acesso</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Concluir cadastro</h2>
          <p className="text-sm text-gray-500 mb-6">
            Confirme seu nome e crie uma senha para entrar no sistema.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* E-mail (read-only, vindo do convite) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
                <Mail size={14} className="text-gray-400" />
                <span className="truncate">{sessionUser?.email}</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Este é o e-mail usado pelo seu administrador no convite</p>
            </div>

            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Como quer ser chamado no sistema"
                required
                autoComplete="name"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Mostrar/ocultar senha"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirmar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
              <input
                type={showPwd ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repita a senha"
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2 mt-2 shadow-orange-glow hover:shadow-orange-glow-lg"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Salvando...' : 'Concluir cadastro e entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-orange-200/60 text-xs mt-6">
          Studio Ideação Ltda · Sistema interno
        </p>
      </div>
    </AuthShell>
  )
}
