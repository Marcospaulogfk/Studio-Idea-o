import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

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

  // Fluxo de código OAuth / Magic Link
  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
    return NextResponse.redirect(`${origin}${next}`)
  }

  // Fluxo de token hash (convite / reset de senha)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })

    if (!error) {
      // Se for convite ou recovery, redireciona para definir senha
      if (type === 'invite' || type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/update-password`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Fallback: redireciona para login com erro
  return NextResponse.redirect(`${origin}/auth/login?error=auth_error`)
}
