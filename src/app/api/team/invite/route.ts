import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { UserRole } from '@/types'

const VALID_ROLES: UserRole[] = ['admin', 'manager', 'operator']

async function getCallerProfile() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null
  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('id, email, role')
    .eq('email', user.email)
    .maybeSingle()
  return profile
}

export async function POST(req: NextRequest) {
  const caller = await getCallerProfile()
  if (!caller) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (caller.role !== 'admin' && caller.role !== 'manager') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  let body: { name?: string; email?: string; role?: UserRole; resend?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  const name = (body.name ?? '').trim()
  const email = (body.email ?? '').trim().toLowerCase()
  const role = body.role ?? 'operator'
  const resend = !!body.resend

  if (!name || !email) {
    return NextResponse.json({ error: 'Nome e e-mail são obrigatórios' }, { status: 400 })
  }
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Cargo inválido' }, { status: 400 })
  }
  // Manager não pode criar admin
  if (caller.role === 'manager' && role === 'admin') {
    return NextResponse.json({ error: 'Apenas admins podem cadastrar admins' }, { status: 403 })
  }

  // Em produção (atrás de proxy), origin pode vir nulo. Prioriza NEXT_PUBLIC_APP_URL.
  const origin = process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin') || 'http://localhost:3000'
  // Sem query string — Supabase ignora `?next=...` no redirect_to e cai pro Site URL.
  // O próprio /auth/callback detecta type=recovery|invite e redireciona pra update-password.
  const redirectTo = `${origin}/auth/callback`

  // Cliente público pra disparar e-mail de recovery quando user já existe
  // (resetPasswordForEmail manda o e-mail; generateLink só gera o link sem enviar).
  const supabasePublic = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // 1ª tentativa: convite formal (cria user no auth.users + envia e-mail de invite)
  const { data: invited, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { name, role },
    redirectTo,
  })

  let invitedUserId = invited?.user?.id

  if (inviteErr) {
    const msg = inviteErr.message ?? ''
    // Cobre as variações: "already been registered", "already exists", "User already", "email_exists"
    const alreadyRegistered = /already.*registered|already.*exists|already been|email_exists/i.test(msg)

    if (resend || alreadyRegistered) {
      // User já existe — dispara link de recovery (ENVIA o e-mail).
      // Funciona tanto pra quem nunca logou quanto pra quem já logou.
      const { error: resetErr } = await supabasePublic.auth.resetPasswordForEmail(email, { redirectTo })
      if (resetErr) {
        return NextResponse.json({ error: resetErr.message }, { status: 400 })
      }
      // Tenta capturar o id do user existente pra linkar com public.users abaixo
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
      const found = list?.users?.find(u => u.email?.toLowerCase() === email)
      if (found) invitedUserId = found.id
    } else {
      return NextResponse.json({ error: msg || 'Falha ao enviar convite' }, { status: 400 })
    }
  }

  // Garante o registro em `users` (UPSERT por email)
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  // Convidado fica como pendente (active=false) até definir a senha pela primeira vez.
  // Reenvio também não reativa — só o login efetivo do convidado faz isso.
  let user
  if (existing) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ name, role })
      .eq('id', existing.id)
      .select('id, email, name, role, active, created_at')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    user = data
  } else {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        id: invitedUserId,
        email,
        name,
        role,
        active: false,
      })
      .select('id, email, name, role, active, created_at')
      .single()
    if (error) {
      const fallback = await supabaseAdmin
        .from('users')
        .insert({ email, name, role, active: false })
        .select('id, email, name, role, active, created_at')
        .single()
      if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 500 })
      user = fallback.data
    } else {
      user = data
    }
  }

  return NextResponse.json({ user })
}
