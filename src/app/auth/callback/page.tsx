'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

/**
 * Página de callback robusta — aceita 3 formatos do Supabase Auth:
 *
 * 1) Implicit flow (legacy): #access_token=...&refresh_token=...&type=recovery
 * 2) PKCE flow:              ?code=xxx
 * 3) Token-hash flow:        ?token_hash=xxx&type=recovery
 *
 * O server-side (route handler) não enxerga o hash, então a detecção
 * é feita aqui no client.
 */
export default function AuthCallback() {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function handleCallback() {
      const url = new URL(window.location.href)
      const search = url.searchParams
      // Hash vem como "#access_token=...&refresh_token=...&type=recovery"
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))

      // Determina type pra saber se redireciona pra update-password ou dashboard
      const type = search.get('type') || hash.get('type') || ''
      const nextParam = search.get('next')
      const isInviteOrRecovery = type === 'invite' || type === 'recovery' || nextParam === '/auth/update-password'
      const fallbackNext = isInviteOrRecovery ? '/auth/update-password' : '/dashboard'

      try {
        // 1) Implicit flow (hash com access_token + refresh_token)
        const accessToken = hash.get('access_token')
        const refreshToken = hash.get('refresh_token')
        if (accessToken && refreshToken) {
          const { error: setErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (setErr) throw setErr
          if (cancelled) return
          router.replace(nextParam || fallbackNext)
          return
        }

        // 2) PKCE flow (code)
        const code = search.get('code')
        if (code) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code)
          if (exErr) throw exErr
          if (cancelled) return
          router.replace(nextParam || fallbackNext)
          return
        }

        // 3) Token-hash flow
        const tokenHash = search.get('token_hash')
        if (tokenHash && type) {
          const { error: otpErr } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any,
          })
          if (otpErr) throw otpErr
          if (cancelled) return
          router.replace(isInviteOrRecovery ? '/auth/update-password' : (nextParam || '/dashboard'))
          return
        }

        // Nada veio na URL — link inválido
        if (isInviteOrRecovery) {
          // Manda pra update-password que já tem fallback de "link expirado"
          router.replace('/auth/update-password')
          return
        }
        throw new Error('Link inválido. Sem credenciais na URL.')
      } catch (err: any) {
        if (cancelled) return
        // Pra invite/recovery, ainda manda pra update-password (mostra mensagem amigável)
        if (isInviteOrRecovery) {
          router.replace('/auth/update-password')
          return
        }
        setError(err?.message ?? 'Não foi possível concluir o login.')
      }
    }

    handleCallback()
    return () => { cancelled = true }
  }, [router, supabase])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-red-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Erro ao validar link</h2>
          <p className="text-sm text-gray-500 mt-2">{error}</p>
          <Link
            href="/auth/login"
            className="inline-block mt-5 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl text-sm"
          >
            Ir para login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        <Loader2 size={32} className="animate-spin text-orange-500 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Validando seu acesso...</p>
      </div>
    </div>
  )
}
