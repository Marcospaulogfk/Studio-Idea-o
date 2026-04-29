import { createClient } from '@/lib/supabase/server'
import AfterSalesClient from '@/components/modules/aftersales/AfterSalesClient'

export default async function AfterSalesPage() {
  const supabase = createClient()
  const { data: aftersales } = await supabase
    .from('aftersales')
    .select('*, client:clients(id, name), sale:sales(id, services, total_value)')
    .order('created_at', { ascending: false })
  return <AfterSalesClient initialAftersales={aftersales ?? []} />
}
