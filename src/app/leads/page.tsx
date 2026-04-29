import { createClient } from '@/lib/supabase/server'
import LeadsClient from '@/components/modules/leads/LeadsClient'

export default async function LeadsPage() {
  const supabase = createClient()

  const { data: leads } = await supabase
    .from('leads')
    .select('*, followups(*)')
    .order('created_at', { ascending: false })

  return <LeadsClient initialLeads={leads ?? []} />
}
