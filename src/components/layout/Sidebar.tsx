'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, UserPlus, ShoppingBag, Package,
  Clapperboard, DollarSign, Star, Bell, LogOut, ChevronRight
} from 'lucide-react'

const NAV = [
  { href: '/dashboard',    label: 'Dashboard',   icon: LayoutDashboard, badge: null },
  { href: '/leads',        label: 'Leads',        icon: UserPlus,        badge: null },
  { href: '/clients',      label: 'Clientes',     icon: Users,           badge: null },
  { href: '/sales',        label: 'Vendas',       icon: ShoppingBag,     badge: null },
  { href: '/packages',     label: 'Pacotes',      icon: Package,         badge: null },
  { href: '/production',   label: 'Produção',     icon: Clapperboard,    badge: null },
  { href: '/financial',    label: 'Financeiro',   icon: DollarSign,      badge: null },
  { href: '/aftersales',   label: 'Pós-Venda',    icon: Star,            badge: null },
]

export function Sidebar({ notifications = 0 }: { notifications?: number }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-brand-800 flex flex-col z-40 shadow-xl">
      {/* Logo */}
      <div className="p-6 border-b border-brand-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">SI</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Studio Ideação</p>
            <p className="text-brand-300 text-xs">CRM · ERP · BI</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                active
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-brand-200 hover:bg-white/8 hover:text-white'
              )}
            >
              <Icon size={18} className={cn(active ? 'text-white' : 'text-brand-300 group-hover:text-white')} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={14} className="text-white/50" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-brand-700 space-y-1">
        <Link
          href="/notifications"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-brand-200 hover:bg-white/8 hover:text-white transition-all"
        >
          <Bell size={18} className="text-brand-300" />
          <span className="flex-1">Notificações</span>
          {notifications > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {notifications}
            </span>
          )}
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-brand-200 hover:bg-red-500/20 hover:text-red-300 transition-all"
        >
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
