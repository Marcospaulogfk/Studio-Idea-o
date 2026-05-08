import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth'
import TeamClient from '@/components/modules/team/TeamClient'

export const dynamic = 'force-dynamic'

export default async function TeamPage() {
  const me = await requireRole(['admin', 'manager'])

  const { data: members } = await supabaseAdmin
    .from('users')
    .select('id, email, name, role, active, created_at')
    .order('created_at', { ascending: false })

  // Cruza com auth.users pra saber quem nunca logou (último sign-in)
  // Faz um join em memória — n é pequeno (time da empresa)
  const { data: authList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const lastSignInByEmail = new Map<string, string | null>()
  for (const au of authList?.users ?? []) {
    if (au.email) lastSignInByEmail.set(au.email.toLowerCase(), au.last_sign_in_at ?? null)
  }

  const enriched = (members ?? []).map(m => ({
    ...m,
    last_sign_in_at: lastSignInByEmail.get(m.email.toLowerCase()) ?? null,
  }))

  return <TeamClient initial={enriched} currentUserRole={me.role} currentUserId={me.id} />
}
