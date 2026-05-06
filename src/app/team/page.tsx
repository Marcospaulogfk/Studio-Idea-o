import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth'
import TeamClient from '@/components/modules/team/TeamClient'

export default async function TeamPage() {
  const me = await requireRole(['admin', 'manager'])

  const { data: members } = await supabaseAdmin
    .from('users')
    .select('id, email, name, role, active, created_at')
    .order('created_at', { ascending: false })

  return <TeamClient initial={members ?? []} currentUserRole={me.role} currentUserId={me.id} />
}
