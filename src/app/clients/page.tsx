import { createClient } from '@/lib/supabase/server'
import ClientsClient from '@/components/modules/clients/ClientsClient'

export default async function ClientsPage() {
  const supabase = createClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('*, sales(id, total_value, sold_at, services)')
    .order('ltv', { ascending: false })
  return <ClientsClient initialClients={clients ?? []} />
}
