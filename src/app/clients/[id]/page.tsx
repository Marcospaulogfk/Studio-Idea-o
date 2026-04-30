import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ClientDetailClient from '@/components/modules/clients/ClientDetailClient'

interface PageProps { params: { id: string } }

export default async function ClientDetailPage({ params }: PageProps) {
  const supabase = createClient()
  const [
    { data: client },
    { data: sales },
    { data: packages },
    { data: productions },
    { data: aftersales },
  ] = await Promise.all([
    supabase.from('clients').select('*').eq('id', params.id).single(),
    supabase.from('sales').select('*').eq('client_id', params.id).order('sold_at', { ascending: false }),
    supabase.from('packages').select('*').eq('client_id', params.id).order('created_at', { ascending: false }),
    supabase.from('productions').select('*').eq('client_id', params.id).order('created_at', { ascending: false }),
    supabase.from('aftersales').select('*').eq('client_id', params.id).order('created_at', { ascending: false }),
  ])

  if (!client) notFound()

  return (
    <ClientDetailClient
      client={client}
      sales={sales ?? []}
      packages={packages ?? []}
      productions={productions ?? []}
      aftersales={aftersales ?? []}
    />
  )
}
