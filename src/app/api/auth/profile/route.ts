import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  let body: { name?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Payload inválido' }, { status: 400 }) }

  const name = (body.name ?? '').trim()
  if (!name) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ name })
    .eq('email', user.email)
    .select('id, email, name, role, active')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mantém metadata do auth.users sincronizado pra futuros JWTs
  if (data?.id) {
    await supabaseAdmin.auth.admin.updateUserById(data.id, { user_metadata: { name } }).catch(() => {})
  }

  return NextResponse.json({ user: data })
}
