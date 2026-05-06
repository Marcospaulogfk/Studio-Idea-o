import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import FinancialClient from '@/components/modules/financial/FinancialClient'

export default async function FinancialPage() {
  await requireRole(['admin', 'manager'])
  const supabase = createClient()
  const { data: financials } = await supabase
    .from('financials')
    .select('*, sale:sales(id, client:clients(name))')
    .order('due_date', { ascending: true })
  return <FinancialClient initialFinancials={financials ?? []} />
}
