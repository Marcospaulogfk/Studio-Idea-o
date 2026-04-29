'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
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

export function Sidebar({ notifications = 0 }: { notifications?: number }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

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
            : 'text-slate-300 hover:bg-orange-500/10 hover:text-orange-400',
        )}
      >
        <Icon
          size={18}
          className={cn(
            'transition-colors duration-200 shrink-0',
            active ? 'text-white' : 'text-slate-400 group-hover:text-orange-400',
          )}
        />
        <span className="flex-1">{item.label}</span>
      </Link>
    )
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar flex flex-col z-40 shadow-xl">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/5">
        <Image
          src="/img/logo-studio-white.svg"
          alt="Studio Ideação"
          width={200}
          height={40}
          priority
          className="h-9 w-auto"
        />
        <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mt-2.5">CRM · ERP · BI</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-2">Principal</p>
        <div className="space-y-0.5">{main.map(renderNavItem)}</div>

        <div className="my-4 border-t border-white/5" />

        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-2">Operações</p>
        <div className="space-y-0.5">{ops.map(renderNavItem)}</div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/5 space-y-1">
        <Link
          href="/notifications"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-orange-500/10 hover:text-orange-400 transition-all duration-200 group"
        >
          <Bell size={18} className="text-slate-400 group-hover:text-orange-400 transition-colors duration-200" />
          <span className="flex-1">Notificações</span>
          {notifications > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {notifications}
            </span>
          )}
        </Link>

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-orange-500/10 hover:text-orange-400 transition-all duration-200 group"
        >
          {mounted && theme === 'dark' ? (
            <Sun size={18} className="text-slate-400 group-hover:text-orange-400 transition-colors duration-200" />
          ) : (
            <Moon size={18} className="text-slate-400 group-hover:text-orange-400 transition-colors duration-200" />
          )}
          <span className="flex-1 text-left">
            {mounted ? (theme === 'dark' ? 'Modo claro' : 'Modo escuro') : 'Tema'}
          </span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-red-500/15 hover:text-red-400 transition-all duration-200"
        >
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
