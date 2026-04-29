import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Studio Ideação — CRM · ERP · BI',
  description: 'Sistema de gestão integrada do Studio Ideação',
  icons: { icon: '/img/logo-studio.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'text-sm',
              style: {
                background: 'var(--card)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
