import { createClient } from '@/lib/supabase/server'
import PackagesClient from '@/components/modules/packages/PackagesClient'

export default async function PackagesPage() {
  const supabase = createClient()
  const { data: packages } = await supabase
    .from('packages')
    .select('*, client:clients(id, name), sale:sales(id, services)')
    .order('expires_at', { ascending: true })
  return <PackagesClient initialPackages={packages ?? []} />
}
