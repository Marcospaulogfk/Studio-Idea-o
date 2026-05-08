import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const nextParam = searchParams.get('next')

  // Detecta se a confirmação é de convite/recuperação. Quando vem de
  // PKCE (code), o type pode não vir como query — usamos o `next` ou o
  // próprio request referer pra inferir.
  const isInviteOrRecovery =
    type === 'invite' ||
    type === 'recovery' ||
    nextParam === '/auth/update-password'

  const fallbackNext = isInviteOrRecovery ? '/auth/update-password' : '/dashboard'
  const next = nextParam || fallbackNext

  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // 1) Fluxo PKCE com code (formato moderno do Supabase)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      // Se for invite/recovery, manda pra tela de update-password mesmo sem sessão.
      // A própria página detecta sessão ausente e mostra mensagem útil.
      if (isInviteOrRecovery) {
        return NextResponse.redirect(`${origin}/auth/update-password`)
      }
      return NextResponse.redirect(`${origin}/auth/login?error=invalid_code`)
    }
    return NextResponse.redirect(`${origin}${next}`)
  }

  // 2) Fluxo legado de token_hash (alguns templates do Supabase ainda usam)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
    if (!error) {
      if (type === 'invite' || type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/update-password`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
    if (type === 'invite' || type === 'recovery') {
      return NextResponse.redirect(`${origin}/auth/update-password`)
    }
    return NextResponse.redirect(`${origin}/auth/login?error=invalid_token`)
  }

  // Sem code nem token — provavelmente o link foi clicado direto (preview do Gmail
  // pré-consume o token). Manda pra update-password que mostra mensagem amigável.
  if (isInviteOrRecovery) {
    return NextResponse.redirect(`${origin}/auth/update-password`)
  }
  return NextResponse.redirect(`${origin}/auth/login?error=auth_error`)
}
