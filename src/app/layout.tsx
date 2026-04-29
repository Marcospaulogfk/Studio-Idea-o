import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Studio Ideação — CRM · ERP · BI',
  description: 'Sistema de gestão integrada do Studio Ideação',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
