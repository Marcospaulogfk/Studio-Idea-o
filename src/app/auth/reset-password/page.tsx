'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

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
      <div className="min-h-screen bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">E-mail enviado!</h2>
          <p className="text-gray-500 mt-2 text-sm">
            Verifique a caixa de entrada de <strong>{email}</strong> e clique no link para definir sua senha.
          </p>
          <Link href="/auth/login" className="inline-block mt-6 text-sm text-brand-700 hover:underline font-medium">
            Voltar para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
            <span className="text-2xl font-bold text-white">SI</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Studio Ideação</h1>
          <p className="text-brand-200 mt-1 text-sm">Recuperação de acesso</p>
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-700 hover:bg-brand-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </form>

          <Link href="/auth/login" className="flex items-center justify-center gap-1 mt-4 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft size={14} /> Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  )
}
