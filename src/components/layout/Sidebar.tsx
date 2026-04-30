'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/logo'
import {
  LayoutDashboard, Users, UserPlus, ShoppingBag, Package,
  Clapperboard, DollarSign, Star, Bell, LogOut, Sun, Moon,
} from 'lucide-react'

type NavItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
  group: 'main' | 'ops'
}

const NAV: NavItem[] = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard, group: 'main' },
  { href: '/leads',      label: 'Leads',      icon: UserPlus,        group: 'main' },
  { href: '/clients',    label: 'Clientes',   icon: Users,           group: 'main' },
  { href: '/sales',      label: 'Vendas',     icon: ShoppingBag,     group: 'main' },
  { href: '/packages',   label: 'Pacotes',    icon: Package,         group: 'ops' },
  { href: '/production', label: 'Produção',   icon: Clapperboard,    group: 'ops' },
  { href: '/financial',  label: 'Financeiro', icon: DollarSign,      group: 'ops' },
  { href: '/aftersales', label: 'Pós-Venda',  icon: Star,            group: 'ops' },
]

export function Sidebar({ notifications: initialCount = 0 }: { notifications?: number }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [unreadCount, setUnreadCount] = useState<number>(initialCount)

  useEffect(() => setMounted(true), [])

  // Busca contagem de não lidas + atualiza quando o user muda de rota
  useEffect(() => {
    let cancelled = false
    async function fetchCount() {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('read', false)
      if (!cancelled && typeof count === 'number') setUnreadCount(count)
    }
    fetchCount()
    return () => { cancelled = true }
  }, [pathname, supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const main = NAV.filter(n => n.group === 'main')
  const ops  = NAV.filter(n => n.group === 'ops')

  const renderNavItem = (item: NavItem) => {
    const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
    const Icon = item.icon
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
          active
            ? 'bg-orange-500 text-white shadow-orange-glow'
            : 'text-gray-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400',
        )}
      >
        <Icon
          size={18}
          className={cn(
            'transition-colors duration-200 shrink-0',
            active
              ? 'text-white'
              : 'text-gray-400 dark:text-slate-400 group-hover:text-orange-500 dark:group-hover:text-orange-400',
          )}
        />
        <span className="flex-1">{item.label}</span>
      </Link>
    )
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-sidebar border-r border-gray-200 dark:border-transparent flex flex-col z-40 shadow-xl">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-gray-100 dark:border-white/5">
        <Logo bg="auto" height={36} priority />
        <p className="text-gray-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.2em] mt-2.5">CRM · ERP · BI</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
        <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-2">Principal</p>
        <div className="space-y-0.5">{main.map(renderNavItem)}</div>

        <div className="my-4 border-t border-gray-100 dark:border-white/5" />

        <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-2">Operações</p>
        <div className="space-y-0.5">{ops.map(renderNavItem)}</div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 dark:border-white/5 space-y-1">
        <Link
          href="/notifications"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-200 group"
        >
          <Bell size={18} className="text-gray-400 dark:text-slate-400 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors duration-200" />
          <span className="flex-1">Notificações</span>
          {unreadCount > 0 && (
            <span className="bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-200 group"
        >
          {mounted && theme === 'dark' ? (
            <Sun size={18} className="text-gray-400 dark:text-slate-400 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors duration-200" />
          ) : (
            <Moon size={18} className="text-gray-400 dark:text-slate-400 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors duration-200" />
          )}
          <span className="flex-1 text-left">
            {mounted ? (theme === 'dark' ? 'Modo claro' : 'Modo escuro') : 'Tema'}
          </span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-500/15 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
        >
          <LogOut size={18} className="text-gray-400 dark:text-slate-400" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
