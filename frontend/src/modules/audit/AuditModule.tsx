import { useEffect, useState } from 'react'
import { ScrollText, User, Globe, Loader2 } from 'lucide-react'
import { api } from '@/api/client'

interface AuditEvent {
  id: string
  userId: string
  action: string
  resourceType: string
  resourceId: string
  details: string
  ipAddress: string
  timestamp: string
}

export function AuditModule() {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<AuditEvent[]>('/audit/events/default')
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy font-display">Auditoria</h1>
        <p className="text-sm text-slate-400">Trilha de auditoria completa de todas as ações</p>
      </div>

      <div className="bg-white rounded-3xl card-shadow border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-lime" />
            <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Eventos Recentes</h2>
          </div>
        </div>
        {events.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-slate-400">
            <ScrollText className="w-5 h-5 mr-2" />
            Nenhum evento de auditoria registrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Usuário</th>
                  <th className="text-left p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Ação</th>
                  <th className="text-left p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Recurso</th>
                  <th className="text-left p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">IP</th>
                  <th className="text-left p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Data</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-sm text-brand-navy">
                      <span className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {evt.userId}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-ice-blue text-brand-navy rounded text-[11px] font-medium">{evt.action}</span>
                    </td>
                    <td className="p-3 text-sm text-slate-600">{evt.resourceType}/{evt.resourceId}</td>
                    <td className="p-3 text-sm text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-3 h-3" />
                        {evt.ipAddress}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-slate-400">{new Date(evt.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
