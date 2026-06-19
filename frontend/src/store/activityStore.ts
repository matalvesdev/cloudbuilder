import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { dashboardApi } from '@/api/dashboardApi'
import type { ActivityEvent, ActivityType, ActivitySeverity } from '@/types/activity.types'

export interface ActivityState {
  events: ActivityEvent[]
  maxEvents: number
  loading: boolean

  addEvent: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => void
  getRecent: (limit?: number) => ActivityEvent[]
  getByType: (type: ActivityType) => ActivityEvent[]
  getByModule: (module: string) => ActivityEvent[]
  getAlerts: () => ActivityEvent[]
  clearAll: () => void
  fetchActivityEvents: () => Promise<void>
}

const NOW = new Date().toISOString()
const MIN_AGO = (mins: number) => new Date(Date.now() - mins * 60_000).toISOString()

const mockEvents: ActivityEvent[] = [
  { id: crypto.randomUUID(), type: 'design_save', title: 'Design salvo', description: 'AWS VPC + EC2 — 8 nós, 5 conexões', module: 'design', severity: 'success', timestamp: MIN_AGO(2), link: { module: 'design', label: 'Abrir Design' } },
  { id: crypto.randomUUID(), type: 'deploy_success', title: 'Deploy realizado', description: 'staging: v4 — 12 recursos implantados', module: 'provision', severity: 'success', timestamp: MIN_AGO(5), link: { module: 'provision', label: 'Ver Deploy' } },
  { id: crypto.randomUUID(), type: 'drift_detected', title: 'Drift detectado', description: '2 recursos com alterações — RDS (db.t3.medium → db.t3.large)', module: 'observe', severity: 'warning', timestamp: MIN_AGO(8), link: { module: 'observe', label: 'Ver Drift' } },
  { id: crypto.randomUUID(), type: 'compliance_violation', title: 'Violação de compliance', description: 'Criptografia em Repouso — S3 Bucket sem encryption', module: 'platform', severity: 'error', timestamp: MIN_AGO(12), link: { module: 'platform', label: 'Corrigir' } },
  { id: crypto.randomUUID(), type: 'approval_requested', title: 'Aprovação pendente', description: 'Maria solicita promoção dev→staging (4 recursos)', module: 'provision', severity: 'info', timestamp: MIN_AGO(15), link: { module: 'provision', label: 'Revisar' } },
  { id: crypto.randomUUID(), type: 'cost_saving', title: 'Otimização disponível', description: 'ec2-webapp: t3.xlarge → t3.medium economiza $87/mês', module: 'cost', severity: 'success', timestamp: MIN_AGO(20), link: { module: 'cost', label: 'Ver Otimizações' } },
  { id: crypto.randomUUID(), type: 'ai_autofix', title: 'Correção automática AI', description: 'RDS CPU > 90% — escala de db.t3.micro para db.t3.medium', module: 'aiops', severity: 'info', timestamp: MIN_AGO(25), link: { module: 'aiops', label: 'Ver Histórico' } },
  { id: crypto.randomUUID(), type: 'collaboration_comment', title: 'Novo comentário', description: 'João: "Precisamos adicionar um WAF antes do ALB"', module: 'design', severity: 'info', timestamp: MIN_AGO(30), link: { module: 'design', label: 'Ver Comentário' } },
  { id: crypto.randomUUID(), type: 'deploy_promote', title: 'Promoção concluída', description: 'dev → staging: v3 promovido com sucesso', module: 'provision', severity: 'success', timestamp: MIN_AGO(35), link: { module: 'provision', label: 'Ver Pipeline' } },
  { id: crypto.randomUUID(), type: 'deploy_fail', title: 'Pipeline falhou', description: 'staging: v4 — erro no terraform apply (timeout)', module: 'provision', severity: 'error', timestamp: MIN_AGO(45), link: { module: 'provision', label: 'Ver Logs' } },
  { id: crypto.randomUUID(), type: 'cost_anomaly', title: 'Anomalia de custo', description: 'NAT Gateway sem tráfego — $32/mês desperdiçado', module: 'cost', severity: 'warning', timestamp: MIN_AGO(55), link: { module: 'cost', label: 'Analisar' } },
  { id: crypto.randomUUID(), type: 'compliance_fixed', title: 'Compliance corrigida', description: 'IAM Menor Privilégio — regra 0.0.0.0/0:22 removida', module: 'platform', severity: 'success', timestamp: MIN_AGO(60), link: { module: 'platform', label: 'Verificar' } },
  { id: crypto.randomUUID(), type: 'user_login', title: 'Usuário conectado', description: 'Admin — novo acesso ao dashboard', module: 'dashboard', severity: 'info', timestamp: MIN_AGO(65) },
]

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      events: mockEvents,
      maxEvents: 100,
      loading: false,

      addEvent: (event) => {
        const newEvent: ActivityEvent = {
          ...event,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        }
        set((state) => {
          const updated = [newEvent, ...state.events]
          if (updated.length > state.maxEvents) updated.length = state.maxEvents
          return { events: updated }
        })
      },

      getRecent: (limit = 10) => {
        return get().events.slice(0, limit)
      },

      getByType: (type) => {
        return get().events.filter((e) => e.type === type)
      },

      getByModule: (module) => {
        return get().events.filter((e) => e.module === module)
      },

      getAlerts: () => {
        return get().events.filter((e) =>
          e.severity === 'error' || e.severity === 'warning'
        )
      },

      clearAll: () => set({ events: [] }),

      fetchActivityEvents: async () => {
        set({ loading: true })
        try {
          const envId = localStorage.getItem('cloudbuilder-active-environment') || 'default'
          const observeData = await dashboardApi.getObserveDashboard(envId)
          if (observeData && observeData.alerts.length > 0) {
            const apiEvents: ActivityEvent[] = observeData.alerts.map((a) => ({
              id: crypto.randomUUID(),
              type: a.severity === 'critical' ? 'compliance_violation' as ActivityType : 'drift_detected' as ActivityType,
              title: a.message,
              description: a.serviceName,
              module: 'observe',
              severity: a.severity === 'critical' ? 'error' as ActivitySeverity : 'warning' as ActivitySeverity,
              timestamp: a.timestamp,
            }))
            set({ events: apiEvents, loading: false })
            return
          }
        } catch {
          // fallback silencioso — mantém mock data
        }
        // Fallback: refresh mock timestamps
        const refreshed = mockEvents.map((e) => ({
          ...e,
          id: crypto.randomUUID(),
          timestamp: new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString(),
        }))
        set({ events: refreshed, loading: false })
      },
    }),
    {
      name: 'cloudbuilder-activity',
    }
  )
)
