'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'
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

export default function ResetPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery&next=/auth/update-password`,
    })

    if (error) {
      setError('Erro ao enviar e-mail. Verifique o endereço.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <AuthShell>
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center relative">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">E-mail enviado!</h2>
          <p className="text-gray-500 mt-2 text-sm">
            Verifique a caixa de entrada de <strong>{email}</strong> e clique no link para definir sua senha.
          </p>
          <Link href="/auth/login" className="inline-block mt-6 text-sm text-orange-600 hover:text-orange-700 font-medium">
            Voltar para o login
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <Logo bg="dark" height={48} priority className="mx-auto mb-3" />
          <p className="text-orange-200/80 text-xs tracking-widest uppercase">Recuperação de acesso</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Esqueceu sua senha?</h2>
          <p className="text-sm text-gray-500 mb-6">Digite seu e-mail e enviaremos um link para criar uma nova senha.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2 shadow-orange-glow hover:shadow-orange-glow-lg"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </form>

          <Link href="/auth/login" className="flex items-center justify-center gap-1 mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft size={14} /> Voltar para o login
          </Link>
        </div>
      </div>
    </AuthShell>
  )
}
