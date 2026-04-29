import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

// ── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  variant = 'primary', size = 'md', loading, children, className, disabled, ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed'
  const variants = {
    primary:   'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-glow hover:shadow-orange-glow-lg',
    secondary: 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/60 shadow-sm',
    ghost:     'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800',
    danger:    'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  )
}

// ── Badge ────────────────────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode
  variant?: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple' | 'orange'
  /** Mostra um dot animado ao lado (status crítico, leads sem contato, etc.) */
  pulse?: boolean
  className?: string
}

export function Badge({ children, variant = 'gray', pulse, className }: BadgeProps) {
  const variants = {
    blue:   'bg-blue-50    text-blue-700    border-blue-200    dark:bg-blue-500/10    dark:text-blue-300    dark:border-blue-500/20',
    green:  'bg-green-50   text-green-700   border-green-200   dark:bg-green-500/10   dark:text-green-300   dark:border-green-500/20',
    yellow: 'bg-yellow-50  text-yellow-700  border-yellow-200  dark:bg-yellow-500/10  dark:text-yellow-300  dark:border-yellow-500/20',
    red:    'bg-red-50     text-red-700     border-red-200     dark:bg-red-500/10     dark:text-red-300     dark:border-red-500/20',
    gray:   'bg-gray-100   text-gray-700    border-gray-200    dark:bg-slate-700/50   dark:text-slate-300   dark:border-slate-600',
    purple: 'bg-purple-50  text-purple-700  border-purple-200  dark:bg-purple-500/10  dark:text-purple-300  dark:border-purple-500/20',
    orange: 'bg-orange-50  text-orange-700  border-orange-200  dark:bg-orange-500/10  dark:text-orange-300  dark:border-orange-500/20',
  }
  const dotColor = {
    blue: 'bg-blue-500', green: 'bg-green-500', yellow: 'bg-yellow-500',
    red: 'bg-red-500', gray: 'bg-gray-400', purple: 'bg-purple-500', orange: 'bg-orange-500',
  }
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
      variants[variant], className,
    )}>
      {pulse && <span className={cn('w-1.5 h-1.5 rounded-full animate-soft-pulse', dotColor[variant])} />}
      {children}
    </span>
  )
}

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow',
      'border border-gray-100 dark:border-slate-700 p-6',
      className,
    )}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ── KPI Card (com borda esquerda colorida + gradiente sutil) ─────────────────
type KpiColor = 'orange' | 'blue' | 'green' | 'yellow' | 'red' | 'purple'

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  trend?: { value: string; positive: boolean }
  color?: KpiColor
}

const KPI_THEME: Record<KpiColor, { border: string; iconBg: string; gradient: string }> = {
  orange: { border: 'border-l-orange-500', iconBg: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400', gradient: 'from-white to-orange-50/40 dark:from-slate-800 dark:to-orange-500/5' },
  blue:   { border: 'border-l-blue-500',   iconBg: 'bg-blue-50   text-blue-600   dark:bg-blue-500/10   dark:text-blue-400',   gradient: 'from-white to-blue-50/40   dark:from-slate-800 dark:to-blue-500/5'   },
  green:  { border: 'border-l-green-500',  iconBg: 'bg-green-50  text-green-600  dark:bg-green-500/10  dark:text-green-400',  gradient: 'from-white to-green-50/40  dark:from-slate-800 dark:to-green-500/5'  },
  yellow: { border: 'border-l-yellow-500', iconBg: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400', gradient: 'from-white to-yellow-50/40 dark:from-slate-800 dark:to-yellow-500/5' },
  red:    { border: 'border-l-red-500',    iconBg: 'bg-red-50    text-red-600    dark:bg-red-500/10    dark:text-red-400',    gradient: 'from-white to-red-50/40    dark:from-slate-800 dark:to-red-500/5'    },
  purple: { border: 'border-l-purple-500', iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400', gradient: 'from-white to-purple-50/40 dark:from-slate-800 dark:to-purple-500/5' },
}

export function KpiCard({ title, value, subtitle, icon, trend, color = 'orange' }: KpiCardProps) {
  const t = KPI_THEME[color]
  return (
    <div className={cn(
      'bg-gradient-to-br rounded-2xl shadow-sm hover:shadow-md transition-shadow',
      'border border-gray-100 dark:border-slate-700 border-l-4 p-5',
      t.border, t.gradient,
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 mt-1.5 truncate">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          {trend && (
            <p className={cn('text-xs font-semibold mt-1.5', trend.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={cn('p-2.5 rounded-xl shrink-0', t.iconBg)}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// ── Stat Card (versão hero com gradiente laranja) ────────────────────────────
export function StatCard({ title, value, subtitle, icon }: {
  title: string; value: string; subtitle?: string; icon?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-orange-glow-lg overflow-hidden relative">
      <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute -right-12 -bottom-12 w-40 h-40 rounded-full bg-white/5" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-orange-100">{title}</p>
            <p className="text-3xl font-extrabold mt-1.5">{value}</p>
            {subtitle && <p className="text-sm text-orange-100 mt-1">{subtitle}</p>}
          </div>
          {icon && <div className="p-2.5 rounded-xl bg-white/15">{icon}</div>}
        </div>
      </div>
    </div>
  )
}

// ── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        className={cn(
          'w-full px-3.5 py-2.5 border rounded-xl text-sm transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
          'text-gray-900 dark:text-slate-100',
          error
            ? 'border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30'
            : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500 dark:text-slate-400">{hint}</p>}
    </div>
  )
}

// ── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, error, options, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        className={cn(
          'w-full px-3.5 py-2.5 border rounded-xl text-sm transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
          'bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100',
          error ? 'border-red-300 dark:border-red-500/30' : 'border-gray-200 dark:border-slate-700',
          className,
        )}
        {...props}
      >
        <option value="">Selecione...</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

// ── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">{label}</label>}
      <textarea
        rows={3}
        className={cn(
          'w-full px-3.5 py-2.5 border rounded-xl text-sm transition-all duration-200 resize-none',
          'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
          'text-gray-900 dark:text-slate-100',
          error
            ? 'border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30'
            : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

// ── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode; title: string; description?: string; action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 bg-gray-100 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center text-gray-400 dark:text-slate-400 mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-gray-800 dark:text-slate-200">{title}</h3>
      {description && <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-green-500'
  return (
    <div className={cn('w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden', className)}>
      <div className={cn('h-2 rounded-full transition-all duration-300', color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

// ── Circular Progress (anel SVG) ─────────────────────────────────────────────
export function CircularProgress({ value, max, size = 128, strokeWidth = 12, label }: {
  value: number; max: number; size?: number; strokeWidth?: number; label?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const offset = circumference - (pct / 100) * circumference
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} strokeWidth={strokeWidth} className="stroke-gray-100 dark:stroke-slate-700" fill="none" />
        <circle
          cx={size/2} cy={size/2} r={radius} strokeWidth={strokeWidth}
          className="stroke-orange-500 transition-[stroke-dashoffset] duration-500"
          fill="none" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">{Math.round(pct)}%</p>
        {label && <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-400 mt-0.5">{label}</p>}
      </div>
    </div>
  )
}

// ── Loading Spinner ──────────────────────────────────────────────────────────
export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <Loader2 size={32} className="animate-spin text-orange-500" />
    </div>
  )
}

// ── Page Header ──────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
