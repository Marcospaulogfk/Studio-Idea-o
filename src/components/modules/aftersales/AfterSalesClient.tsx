'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AfterSale, SERVICES } from '@/types'
import { Button, Badge, Card, PageHeader, KpiCard } from '@/components/ui'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Star, CheckCircle, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AfterSalesClient({ initialAftersales }: { initialAftersales: AfterSale[] }) {
  const supabase = createClient()
  const [aftersales, setAftersales] = useState<AfterSale[]>(initialAftersales)
  const [editing, setEditing] = useState<string | null>(null)
  const [nps, setNps] = useState<number>(5)
  const [feedback, setFeedback] = useState('')
  const [upsell, setUpsell] = useState<string[]>([])
  const [nextContact, setNextContact] = useState('')

  const contacted = aftersales.filter(a => a.contacted).length
  const avgNps = aftersales.filter(a=>a.nps_score).reduce((s,a)=>s+(a.nps_score??0),0) / (aftersales.filter(a=>a.nps_score).length || 1)

  async function saveAfterSale(id: string) {
    const { error } = await supabase.from('aftersales').update({
      nps_score: nps, feedback, upsell_interest: upsell,
      next_contact: nextContact || null, contacted: true
    }).eq('id', id)
    if (error) { toast.error('Erro'); return }
    setAftersales(prev => prev.map(a => a.id === id ? {...a, nps_score:nps, feedback, upsell_interest:upsell, next_contact:nextContact||undefined, contacted:true} : a))
    setEditing(null)
    toast.success('Pós-venda salvo!')
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Pós-Venda" subtitle="Acompanhamento, satisfação e oportunidades de upsell"/>

      <div className="grid grid-cols-3 gap-4">
        <KpiCard title="Total de Pós-vendas" value={String(aftersales.length)} icon={<Star size={20}/>} color="blue"/>
        <KpiCard title="Contatados" value={String(contacted)} subtitle={`${aftersales.length-contacted} pendentes`} icon={<CheckCircle size={20}/>} color="green"/>
        <KpiCard title="NPS Médio" value={avgNps.toFixed(1)} subtitle="Escala 1–5" icon={<Star size={20}/>} color="purple"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {aftersales.map(a => {
          const client = (a as any).client
          const sale = (a as any).sale
          const isEditing = editing === a.id
          return (
            <Card key={a.id} className={cn('border-l-4', a.contacted ? 'border-l-green-500' : 'border-l-yellow-500')}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{client?.name ?? '—'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{sale?.services?.join(', ') ?? '—'} · {sale?.total_value ? formatCurrency(sale.total_value) : ''}</p>
                </div>
                <Badge variant={a.contacted ? 'green' : 'yellow'}>
                  {a.contacted ? 'Contatado' : 'Pendente'}
                </Badge>
              </div>

              {a.nps_score && (
                <div className="flex items-center gap-1 mb-2">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={14} className={s <= (a.nps_score??0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}/>
                  ))}
                  <span className="text-xs text-gray-500 ml-1">NPS {a.nps_score}/5</span>
                </div>
              )}

              {a.feedback && <p className="text-xs text-gray-600 italic mb-2">"{a.feedback}"</p>}

              {a.upsell_interest && a.upsell_interest.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {a.upsell_interest.map(s => (
                    <span key={s} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              )}

              {a.next_contact && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                  <Calendar size={12}/> Próximo contato: {formatDate(a.next_contact)}
                </div>
              )}

              {!isEditing ? (
                <Button size="sm" variant="secondary" onClick={() => {
                  setEditing(a.id); setNps(a.nps_score??5); setFeedback(a.feedback??'');
                  setUpsell(a.upsell_interest??[]); setNextContact(a.next_contact??'')
                }}>
                  {a.contacted ? 'Editar' : 'Registrar Pós-venda'}
                </Button>
              ) : (
                <div className="space-y-3 pt-2 border-t border-gray-100 mt-2">
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">NPS (1–5)</p>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(s=>(
                        <button key={s} onClick={()=>setNps(s)} type="button"
                          className={cn('w-8 h-8 rounded-full text-sm font-bold transition-all',
                            s<=nps?'bg-yellow-400 text-white':'bg-gray-100 text-gray-400 hover:bg-gray-200')}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea value={feedback} onChange={e=>setFeedback(e.target.value)}
                    placeholder="Feedback do cliente..."
                    className="w-full text-xs border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" rows={2}/>
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Interesse em serviços</p>
                    <div className="flex flex-wrap gap-1">
                      {SERVICES.map(s=>(
                        <button key={s} type="button" onClick={()=>setUpsell(prev=>prev.includes(s)?prev.filter(x=>x!==s):[...prev,s])}
                          className={cn('text-xs px-2 py-1 rounded-xl border transition-all',
                            upsell.includes(s)?'bg-purple-600 text-white border-purple-600':'bg-white text-gray-600 border-gray-200')}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input type="date" value={nextContact} onChange={e=>setNextContact(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"/>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={()=>setEditing(null)} className="flex-1">Cancelar</Button>
                    <Button size="sm" onClick={()=>saveAfterSale(a.id)} className="flex-1">Salvar</Button>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
