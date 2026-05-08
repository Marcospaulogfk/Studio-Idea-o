import { NextRequest, NextResponse } from 'next/server'
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
  const redirectTo = `${origin}/auth/callback?next=/auth/update-password`

  // Envia o convite via Supabase Auth — se já existir, reenvia.
  const { data: invited, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { name, role },
    redirectTo,
  })

  // Se for resend explícito, ou se falhou por usuário já existente, tentamos reenviar.
  if (inviteErr) {
    const msg = inviteErr.message ?? ''
    const alreadyRegistered = /already registered|already exists|User already/i.test(msg)
    if (resend || alreadyRegistered) {
      const { error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email,
        options: { redirectTo, data: { name, role } },
      })
      if (linkErr) {
        return NextResponse.json({ error: linkErr.message }, { status: 400 })
      }
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
        id: invited?.user?.id,
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
