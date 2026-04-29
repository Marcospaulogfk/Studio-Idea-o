// ============================================================
// STUDIO IDEAÇÃO — Types TypeScript
// ============================================================

export type UserRole = 'admin' | 'manager' | 'operator'
export type LeadStage = 'new' | 'negotiating' | 'closed' | 'disqualified' | 'future'
export type LeadOrigin = 'instagram' | 'web' | 'referral' | 'paid_traffic' | 'whatsapp' | 'other'
export type PaymentStatus = 'pending' | '50%' | '100%'
export type ClientType = 'new' | 'returning'
export type PackageModel = '5' | '10' | '20' | 'custom'
export type PackageStatus = 'active' | 'inactive' | 'expired'
export type ProductionStatus = 'queue' | 'in_progress' | 'done'
export type FinancialType = 'receivable' | 'payable'
export type FinancialStatus = 'pending' | 'paid' | 'overdue'
export type FinancialCategory = 'personal' | 'tools' | 'marketing' | 'rent' | 'taxes' | 'ads' | 'other'
export type NotificationType = 'followup_overdue' | 'package_expiring_15' | 'package_expiring_7' | 'package_expired' | 'sale_pending_payment' | 'production_done'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  active: boolean
  created_at: string
}

export interface Client {
  id: string
  name: string
  phone?: string
  cpf_cnpj?: string
  address?: string
  status: 'active' | 'inactive'
  ltv: number
  created_at: string
  updated_at: string
  // relations
  sales?: Sale[]
  packages?: Package[]
}

export interface Lead {
  id: string
  name: string
  phone?: string
  service?: string
  estimated_value?: number
  origin?: LeadOrigin
  funnel_stage: LeadStage
  position?: number
  notes?: string
  assigned_to?: string
  last_contact?: string
  next_followup?: string
  converted_at?: string
  created_at: string
  updated_at: string
  // relations
  followups?: Followup[]
  assigned_user?: User
}

export interface Followup {
  id: string
  lead_id: string
  user_id?: string
  contacted_at: string
  next_followup?: string
  notes?: string
  created_at: string
  // relations
  lead?: Lead
  user?: User
}

export interface Sale {
  id: string
  client_id: string
  lead_id?: string
  services: string[]
  description?: string
  total_value: number
  origin?: LeadOrigin
  payment_status: PaymentStatus
  client_type: ClientType
  paid_traffic: boolean
  sold_at: string
  created_at: string
  updated_at: string
  // relations
  client?: Client
  lead?: Lead
  packages?: Package[]
}

export interface Package {
  id: string
  sale_id: string
  client_id: string
  model: PackageModel
  arts_total: number
  arts_used: number
  activated_at: string
  expires_at: string
  status: PackageStatus
  created_at: string
  updated_at: string
  // relations
  sale?: Sale
  client?: Client
  productions?: Production[]
  // computed
  days_remaining?: number
  progress_percent?: number
}

export interface Production {
  id: string
  package_id: string
  sale_id: string
  client_id: string
  title?: string
  status: ProductionStatus
  queue_position: number
  assigned_to?: string
  started_at?: string
  finished_at?: string
  notes?: string
  created_at: string
  updated_at: string
  // relations
  package?: Package
  sale?: Sale
  client?: Client
  assigned_user?: User
  files?: FileAsset[]
}

export interface FileAsset {
  id: string
  production_id?: string
  sale_id?: string
  client_id?: string
  file_name: string
  file_path: string
  mime_type?: string
  file_size?: number
  uploaded_by?: string
  storage_provider: 'supabase' | 'vpn'
  created_at: string
}

export interface Financial {
  id: string
  type: FinancialType
  sale_id?: string
  description: string
  amount: number
  category: FinancialCategory
  due_date?: string
  paid_at?: string
  payment_method?: string
  status: FinancialStatus
  created_at: string
  updated_at: string
  // relations
  sale?: Sale
}

export interface AfterSale {
  id: string
  client_id: string
  sale_id: string
  production_id?: string
  nps_score?: number
  feedback?: string
  upsell_interest?: string[]
  next_contact?: string
  contacted: boolean
  created_at: string
  updated_at: string
  // relations
  client?: Client
  sale?: Sale
}

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  entity_id?: string
  entity_type?: string
  read: boolean
  user_id?: string
  created_at: string
}

// Dashboard KPIs
export interface DashboardKPIs {
  leads_this_month: number
  leads_closed_month: number
  conversion_rate: number
  revenue_this_month: number
  avg_ticket: number
  received_this_month: number
  total_receivable: number
  returning_revenue: number
  active_packages: number
  expiring_packages: number
}

export interface RoiByOrigin {
  origin: LeadOrigin
  total_sales: number
  total_revenue: number
  avg_ticket: number
}

export interface TopService {
  service: string
  count: number
  total_revenue: number
}

// Form types
export interface CreateLeadForm {
  name: string
  phone?: string
  service?: string
  estimated_value?: number
  origin?: LeadOrigin
  notes?: string
}

export interface CreateSaleForm {
  client_id: string
  lead_id?: string
  services: string[]
  description?: string
  total_value: number
  origin?: LeadOrigin
  payment_status: PaymentStatus
  client_type: ClientType
  paid_traffic: boolean
  has_package: boolean
  package_model?: PackageModel
  package_arts_total?: number
}

export interface CreateClientForm {
  name: string
  phone?: string
  cpf_cnpj?: string
  address?: string
}

// Labels para UI
export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  new: 'Novo',
  negotiating: 'Em Negociação',
  closed: 'Fechado',
  disqualified: 'Desqualificado',
  future: 'Futuro / Remarketing',
}

export const ORIGIN_LABELS: Record<LeadOrigin, string> = {
  instagram: 'Instagram',
  web: 'Página Web',
  referral: 'Indicação',
  paid_traffic: 'Tráfego Pago',
  whatsapp: 'WhatsApp',
  other: 'Outro',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pendente',
  '50%': '50% Pago',
  '100%': '100% Pago',
}

export const SERVICES = [
  'Artes p/ Redes Sociais',
  'Material Gráfico',
  'Logo / Identidade Visual',
  'Vídeo / Motion',
  'Reels / Stories',
  'Tráfego Pago',
  'Outros',
]

export const PRODUCTION_STATUS_LABELS: Record<ProductionStatus, string> = {
  queue: 'Fila',
  in_progress: 'Em Produção',
  done: 'Finalizado',
}
