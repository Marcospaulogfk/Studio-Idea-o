import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Marca o usuário logado como `active = true` no public.users e
 * sincroniza o nome (caso ele tenha editado no formulário de primeiro acesso).
 * Disparado após o convite definir a senha.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let body: { name?: string } = {}
  try { body = await req.json() } catch {}
  const name = (body.name ?? '').trim()

  const update: Record<string, unknown> = { active: true }
  if (name) update.name = name

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(update)
    .eq('email', user.email)
    .select('id, email, name, role, active')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ user: data })
}
