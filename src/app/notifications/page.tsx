import { createClient } from '@/lib/supabase/server'
import NotificationsClient from '@/components/modules/notifications/NotificationsClient'

export default async function NotificationsPage() {
  const supabase = createClient()
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  return <NotificationsClient initial={notifications ?? []} />
}
