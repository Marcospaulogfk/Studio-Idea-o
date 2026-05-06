import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { UserRole } from '@/types'

export interface AuthProfile {
  id: string
  email: string
  name: string
  role: UserRole
  active: boolean
}

/**
 * Lê o perfil do usuário logado contornando RLS (service role).
 * Retorna null se não houver sessão.
 */
export async function getCurrentProfile(): Promise<AuthProfile | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null
  const { data } = await supabaseAdmin
    .from('users')
    .select('id, email, name, role, active')
    .eq('email', user.email)
    .maybeSingle()
  return (data as AuthProfile) ?? null
}

/**
 * Em Server Components: garante que o usuário tem um dos roles
 * permitidos. Caso contrário, redireciona para /dashboard.
 */
export async function requireRole(allowed: UserRole[]): Promise<AuthProfile> {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/auth/login')
  if (!profile.active) redirect('/auth/login')
  if (!allowed.includes(profile.role)) redirect('/dashboard')
  return profile
}
