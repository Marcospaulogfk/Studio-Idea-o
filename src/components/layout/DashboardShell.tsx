'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Logo } from '@/components/logo'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-neutral-950">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Top bar mobile */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 backdrop-blur">
          <Logo bg="auto" height={28} />
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            className="p-2 rounded-lg text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
