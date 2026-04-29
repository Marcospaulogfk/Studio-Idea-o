import { createClient } from '@/lib/supabase/server'
import ProductionClient from '@/components/modules/production/ProductionClient'

export default async function ProductionPage() {
  const supabase = createClient()
  const { data: productions } = await supabase
    .from('productions')
    .select('*, client:clients(id, name), package:packages(id, arts_total, arts_used, expires_at)')
    .order('queue_position', { ascending: true })
  return <ProductionClient initialProductions={productions ?? []} />
}
