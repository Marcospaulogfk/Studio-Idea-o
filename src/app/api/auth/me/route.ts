import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
  const { data } = await supabaseAdmin
    .from('users')
    .select('id, email, name, role, active')
    .eq('email', user.email)
    .maybeSingle()
  if (!data) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
  return NextResponse.json({ user: data })
}
