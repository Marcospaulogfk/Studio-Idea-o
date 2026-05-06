import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth'
import ProfileClient from '@/components/modules/profile/ProfileClient'

export default async function ProfilePage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/auth/login')
  return <ProfileClient initial={profile} />
}
