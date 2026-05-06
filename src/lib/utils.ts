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

/** Formata input de telefone enquanto digita: (46) 99999-1234 */
export function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2)  return digits.length ? `(${digits}` : ''
  if (digits.length <= 6)  return `(${digits.slice(0,2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`
}

/** Formata CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00) detectando pelo tamanho */
export function formatDocInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2')
  }
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

/** Formata "1234.56" ou "1234,56" → "R$ 1.234,56" durante digitação. Aceita só dígitos. */
export function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  const cents = parseInt(digits, 10)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 2,
  }).format(cents / 100)
}

/** Converte máscara BRL "R$ 1.234,56" para number 1234.56 */
export function parseCurrencyInput(masked: string): number {
  const digits = masked.replace(/\D/g, '')
  if (!digits) return 0
  return parseInt(digits, 10) / 100
}

/** Valida e-mail simples */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/** Valida CPF (11 dígitos com verificação de dígitos verificadores) */
export function isValidCPF(value: string): boolean {
  const cpf = value.replace(/\D/g, '')
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i)
  let d1 = 11 - (sum % 11); if (d1 >= 10) d1 = 0
  if (d1 !== parseInt(cpf[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i)
  let d2 = 11 - (sum % 11); if (d2 >= 10) d2 = 0
  return d2 === parseInt(cpf[10])
}

/** Valida CNPJ (14 dígitos com verificação de dígitos verificadores) */
export function isValidCNPJ(value: string): boolean {
  const cnpj = value.replace(/\D/g, '')
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false
  const calc = (slice: string, weights: number[]) => {
    const sum = slice.split('').reduce((acc, n, i) => acc + parseInt(n) * weights[i], 0)
    const d = sum % 11
    return d < 2 ? 0 : 11 - d
  }
  const w1 = [5,4,3,2,9,8,7,6,5,4,3,2]
  const w2 = [6,5,4,3,2,9,8,7,6,5,4,3,2]
  if (calc(cnpj.slice(0,12), w1) !== parseInt(cnpj[12])) return false
  if (calc(cnpj.slice(0,13), w2) !== parseInt(cnpj[13])) return false
  return true
}

/** Aceita CPF ou CNPJ */
export function isValidDoc(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 11) return isValidCPF(digits)
  if (digits.length === 14) return isValidCNPJ(digits)
  return false
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
