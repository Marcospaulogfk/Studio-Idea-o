import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import TeamClient from '@/components/modules/team/TeamClient'

export default async function TeamPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Pega o role do usuário atual
  const { data: me } = await supabaseAdmin
    .from('users')
    .select('id, email, name, role')
    .eq('email', user.email!)
    .maybeSingle()

  if (!me || (me.role !== 'admin' && me.role !== 'manager')) {
    redirect('/dashboard')
  }

  // Lista todos os colaboradores
  const { data: members } = await supabaseAdmin
    .from('users')
    .select('id, email, name, role, active, created_at')
    .order('created_at', { ascending: false })

  return <TeamClient initial={members ?? []} currentUserRole={me.role} currentUserId={me.id} />
}
