import { createClient } from '@/lib/supabase/server'
import SalesClient from '@/components/modules/sales/SalesClient'

export default async function SalesPage() {
  const supabase = createClient()
  const { data: sales } = await supabase
    .from('sales')
    .select('*, client:clients(id, name, phone)')
    .order('sold_at', { ascending: false })
  const { data: clients } = await supabase.from('clients').select('id, name').eq('status','active')
  return <SalesClient initialSales={sales ?? []} clients={clients ?? []} />
}
