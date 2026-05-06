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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const caller = await getCallerProfile()
  if (!caller) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (caller.role !== 'admin' && caller.role !== 'manager') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  if (caller.id === params.id) {
    return NextResponse.json({ error: 'Você não pode alterar sua própria conta' }, { status: 403 })
  }

  let body: { active?: boolean; role?: UserRole; name?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  // Manager não pode mexer em admin nem promover ninguém a admin
  const { data: target } = await supabaseAdmin.from('users').select('role').eq('id', params.id).maybeSingle()
  if (!target) return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 })

  if (caller.role === 'manager') {
    if (target.role === 'admin') return NextResponse.json({ error: 'Sem permissão sobre administradores' }, { status: 403 })
    if (body.role === 'admin') return NextResponse.json({ error: 'Apenas admins podem promover a admin' }, { status: 403 })
  }

  const update: Record<string, unknown> = {}
  if (typeof body.active === 'boolean') update.active = body.active
  if (body.role) {
    if (!VALID_ROLES.includes(body.role)) return NextResponse.json({ error: 'Cargo inválido' }, { status: 400 })
    update.role = body.role
  }
  if (body.name) update.name = body.name.trim()

  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'Nada a atualizar' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(update)
    .eq('id', params.id)
    .select('id, email, name, role, active, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Se desativou, banir no auth também (evita login)
  if (body.active === false) {
    await supabaseAdmin.auth.admin.updateUserById(params.id, { ban_duration: '876600h' }).catch(() => {})
  } else if (body.active === true) {
    await supabaseAdmin.auth.admin.updateUserById(params.id, { ban_duration: 'none' }).catch(() => {})
  }

  return NextResponse.json({ user: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const caller = await getCallerProfile()
  if (!caller) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (caller.role !== 'admin') {
    return NextResponse.json({ error: 'Apenas admins podem excluir colaboradores' }, { status: 403 })
  }
  if (caller.id === params.id) {
    return NextResponse.json({ error: 'Você não pode excluir sua própria conta' }, { status: 403 })
  }

  // Apaga do auth + da tabela users
  await supabaseAdmin.auth.admin.deleteUser(params.id).catch(() => {})

  const { error } = await supabaseAdmin.from('users').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
