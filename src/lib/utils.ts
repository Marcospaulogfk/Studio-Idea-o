import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInDays, format, formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd/MM/yyyy', { locale: ptBR })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR })
}

export function daysRemaining(expiresAt: string): number {
  return differenceInDays(parseISO(expiresAt), new Date())
}

export function packageProgressPercent(used: number, total: number): number {
  if (total === 0) return 0
  return Math.round((used / total) * 100)
}

export function maskPhone(phone: string): string {
  return phone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')
}

export function maskCPF(cpf: string): string {
  return cpf.replace(/\d(?=\d{3})/g, '*')
}

export function getPackageAlertLevel(daysLeft: number): 'critical' | 'warning' | 'normal' {
  if (daysLeft <= 7) return 'critical'
  if (daysLeft <= 15) return 'warning'
  return 'normal'
}

export function getFollowupUrgency(lastContact: string | null): 'critical' | 'warning' | 'normal' {
  if (!lastContact) return 'critical'
  const days = differenceInDays(new Date(), parseISO(lastContact))
  if (days >= 7) return 'critical'
  if (days >= 3) return 'warning'
  return 'normal'
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const group = String(item[key])
    if (!acc[group]) acc[group] = []
    acc[group].push(item)
    return acc
  }, {} as Record<string, T[]>)
}
