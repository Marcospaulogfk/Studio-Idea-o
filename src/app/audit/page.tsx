import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth'
import AuditClient from '@/components/modules/audit/AuditClient'

export const dynamic = 'force-dynamic'

export default async function AuditPage() {
  await requireRole(['admin'])

  const { data: logs } = await supabaseAdmin
    .from('audit_logs')
    .select('id, table_name, row_id, action, old_data, new_data, changed_by, changed_email, changed_at')
    .order('changed_at', { ascending: false })
    .limit(200)

  return <AuditClient initial={logs ?? []} />
}
