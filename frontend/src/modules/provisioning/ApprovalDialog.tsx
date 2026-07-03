import { useState, useMemo } from 'react'
import {
  Shield, CheckCircle2, XCircle, Clock, User, MessageSquare,
  ArrowRight, FileCode2, Loader2, History, AlertTriangle, ThumbsUp, ThumbsDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApprovalStore } from '@/store/approvalStore'
import { usePromotionStore } from '@/store/promotionStore'
import { useCredentialStore } from '@/store/credentialStore'
import { useCanvasStore } from '@/store/canvasStore'
import { useAuthStore } from '@/store/authStore'
import { ENVIRONMENT_TYPE_LABELS } from '@/types/settings.types'
import { PROMOTION_STATUS_LABELS } from '@/types/promotion.types'

interface ApprovalDialogProps {
  onClose: () => void
}

type Tab = 'pendentes' | 'historico'

export function ApprovalDialog({ onClose }: ApprovalDialogProps) {
  const { teamMembers, approvalRequests, approvalHistory, approve, reject, getApproversForEnv } = useApprovalStore()
  const { promotions, updatePromotionStatus } = usePromotionStore()
  const { environments, deployments, addDeployment, updateEnvironment } = useCredentialStore()
  const { nodes, canvasName } = useCanvasStore()
  const currentUser = useAuthStore((s) => s.user)

  const [tab, setTab] = useState<Tab>('pendentes')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)

  const pendingRequests = useMemo(
    () => approvalRequests.filter((r) => r.status === 'pending')
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()),
    [approvalRequests]
  )

  const historyEntries = useMemo(
    () => [...approvalHistory].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [approvalHistory]
  )

  const selectedRequest = useMemo(
    () => approvalRequests.find((r) => r.id === selectedId) ?? null,
    [approvalRequests, selectedId]
  )

  const selectedHistory = useMemo(
    () => selectedId ? approvalHistory.filter((h) => h.approvalRequestId === selectedId) : [],
    [approvalHistory, selectedId]
  )

  const relatedPromotion = useMemo(
    () => selectedRequest ? promotions.find((p) => p.id === selectedRequest.promotionId) : null,
    [selectedRequest, promotions]
  )

  const canUserApproveThis = useMemo(() => {
    if (!selectedRequest || !currentUser) return false
    if (currentUser.roles.includes('admin')) return true
    const approvers = getApproversForEnv(selectedRequest.targetEnvId)
    return approvers.some((a) => a.email === currentUser.email)
  }, [selectedRequest, currentUser, getApproversForEnv])

  const handleApprove = async () => {
    if (!selectedRequest || !currentUser) return
    setProcessing('approve')
    await new Promise((r) => setTimeout(r, 800))

    const member = teamMembers.find((m) => m.email === currentUser.email)
    const approverName = member?.name ?? currentUser.name

    approve(selectedRequest.id, currentUser.id, approverName, comment)

    const promId = selectedRequest.promotionId
    updatePromotionStatus(promId, 'approved', new Date().toISOString())

    const sourceEnv = environments.find((e) => e.id === selectedRequest.sourceEnvId)
    const targetEnv = environments.find((e) => e.id === selectedRequest.targetEnvId)

    if (targetEnv) {
      addDeployment({
        environmentId: targetEnv.id,
        version: `v${targetEnv.canvasVersion + 1}.0.0`,
        status: 'success',
        resourceCount: selectedRequest.resourceCount,
        duration: '1m 23s',
        startedAt: new Date(Date.now() - 5000).toISOString(),
        completedAt: new Date().toISOString(),
        planSummary: { add: selectedRequest.resourceCount, change: 0, destroy: 0 },
      })
      updateEnvironment(targetEnv.id, {
        canvasVersion: targetEnv.canvasVersion + 1,
        status: 'ACTIVE',
      })
    }

    updatePromotionStatus(promId, 'deployed', new Date().toISOString())

    setComment('')
    setProcessing(null)
  }

  const handleReject = async () => {
    if (!selectedRequest || !currentUser) return
    setProcessing('reject')
    await new Promise((r) => setTimeout(r, 800))

    const member = teamMembers.find((m) => m.email === currentUser.email)
    const approverName = member?.name ?? currentUser.name

    reject(selectedRequest.id, currentUser.id, approverName, comment)
    updatePromotionStatus(selectedRequest.promotionId, 'rejected', new Date().toISOString())

    setComment('')
    setProcessing(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-brand-navy font-display">Aprovações</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Gerencie solicitações de promoção entre ambientes
              </p>
            </div>
            <span className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border',
              pendingRequests.length > 0
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-green-50 text-green-700 border-green-200'
            )}>
              <span className={cn(
                'relative flex h-2 w-2',
              )}>
                {pendingRequests.length > 0 && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                )}
                <span className={cn(
                  'relative inline-flex rounded-full h-2 w-2',
                  pendingRequests.length > 0 ? 'bg-amber-500' : 'bg-green-500'
                )} />
              </span>
              {pendingRequests.length > 0
                ? `${pendingRequests.length} pendente${pendingRequests.length !== 1 ? 's' : ''}`
                : 'Nenhuma pendente'}
            </span>
          </div>
        </div>

        <div className="flex border-b border-slate-100 shrink-0">
          <button
            onClick={() => { setTab('pendentes'); setSelectedId(null) }}
            className={cn(
              'flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all',
              tab === 'pendentes'
                ? 'text-brand-navy border-brand-navy'
                : 'text-slate-400 border-transparent hover:text-slate-600'
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            Pendentes
            {pendingRequests.length > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[9px] font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setTab('historico'); setSelectedId(null) }}
            className={cn(
              'flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all',
              tab === 'historico'
                ? 'text-brand-navy border-brand-navy'
                : 'text-slate-400 border-transparent hover:text-slate-600'
            )}
          >
            <History className="w-3.5 h-3.5" />
            Histórico
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {tab === 'pendentes' && (
            <div className="p-6">
              {pendingRequests.length === 0 ? (
                <div className="py-12 text-center">
                  <Shield className="w-10 h-10 text-green-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-500">Nenhuma aprovação pendente</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Todas as solicitações de promoção foram resolvidas
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((req) => {
                    const sourceEnv = environments.find((e) => e.id === req.sourceEnvId)
                    const targetEnv = environments.find((e) => e.id === req.targetEnvId)
                    const isSelected = selectedId === req.id
                    return (
                      <div
                        key={req.id}
                        onClick={() => setSelectedId(req.id)}
                        className={cn(
                          'rounded-xl border-2 p-4 cursor-pointer transition-all',
                          isSelected
                            ? 'border-brand-navy bg-ice-blue/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                              <Clock className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-brand-navy">{req.requestedByName}</span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(req.requestedAt).toLocaleString('pt-BR')}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-xs font-semibold text-brand-navy">{req.sourceEnvName}</span>
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                                <span className="text-xs font-semibold text-brand-navy">{req.targetEnvName}</span>
                                <span className={cn(
                                  'text-[10px] px-1.5 py-0.5 rounded-full font-bold border',
                                  req.targetEnvType === 'production'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                )}>
                                  {ENVIRONMENT_TYPE_LABELS[req.targetEnvType] ?? req.targetEnvType}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400">{req.resourceCount} recursos</span>
                        </div>

                        {isSelected && (
                          <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                            <div>
                              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Diferenças entre ambientes
                              </p>
                              <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                                {req.diffSummary.map((item) => (
                                  <div key={item.label} className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500">{item.label}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-brand-navy">{item.source}</span>
                                      <ArrowRight className="w-2.5 h-2.5 text-slate-300" />
                                      <span className="font-medium text-brand-navy">{item.target}</span>
                                      {'diff' in item && item.diff !== undefined && (
                                        <span className={cn(
                                          'text-[10px] font-bold px-1.5 py-0.5 rounded',
                                          item.diff > 0 ? 'bg-green-50 text-green-700' :
                                          item.diff < 0 ? 'bg-red-50 text-red-700' :
                                          'bg-slate-100 text-slate-500'
                                        )}>
                                          {item.diff > 0 ? '+' : ''}{item.diff}
                                        </span>
                                      )}
                                      {'same' in item && item.same && (
                                        <span className="text-[10px] font-bold text-green-600">Igual</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                Comentário (opcional)
                              </label>
                              <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Adicione um comentário sobre sua decisão..."
                                rows={2}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy resize-none placeholder:text-slate-400"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleApprove}
                                disabled={processing !== null}
                                className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-xs font-bold bg-green-600 text-white hover:bg-green-700 transition-all disabled:opacity-50"
                              >
                                {processing === 'approve' ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                )}
                                {processing === 'approve' ? 'Aprovando...' : 'Aprovar'}
                              </button>
                              <button
                                onClick={handleReject}
                                disabled={processing !== null}
                                className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-50"
                              >
                                {processing === 'reject' ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <ThumbsDown className="w-3.5 h-3.5" />
                                )}
                                {processing === 'reject' ? 'Rejeitando...' : 'Rejeitar'}
                              </button>
                            </div>

                            {selectedHistory.length > 0 && (
                              <div>
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                  Atividades
                                </p>
                                <div className="space-y-2">
                                  {selectedHistory.map((entry) => (
                                    <div key={entry.id} className="flex items-start gap-2 text-xs text-slate-500">
                                      <span className={cn(
                                        'w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                                        entry.action === 'approved' ? 'bg-green-100 text-green-600' :
                                        entry.action === 'rejected' ? 'bg-red-100 text-red-600' :
                                        entry.action === 'cancelled' ? 'bg-slate-100 text-slate-500' :
                                        'bg-amber-100 text-amber-600'
                                      )}>
                                        {entry.action === 'approved' ? <CheckCircle2 className="w-3 h-3" /> :
                                         entry.action === 'rejected' ? <XCircle className="w-3 h-3" /> :
                                         entry.action === 'cancelled' ? <XCircle className="w-3 h-3" /> :
                                         <Clock className="w-3 h-3" />}
                                      </span>
                                      <div>
                                        <span className="font-medium text-brand-navy">{entry.actorName}</span>
                                        {' '}
                                        {entry.action === 'requested' ? 'solicitou aprovação' :
                                         entry.action === 'approved' ? 'aprovou' :
                                         entry.action === 'rejected' ? 'rejeitou' :
                                         'cancelou'}
                                        {entry.comment && (
                                          <span className="block text-slate-400 mt-0.5 italic">
                                                            "{entry.comment}"
                                                          </span>
                                        )}
                                        <span className="block text-[10px] text-slate-400 mt-0.5">
                                          {new Date(entry.timestamp).toLocaleString('pt-BR')}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'historico' && (
            <div className="p-6">
              {historyEntries.length === 0 ? (
                <div className="py-12 text-center">
                  <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-500">Nenhum histórico de aprovação</p>
                  <p className="text-xs text-slate-400 mt-1">
                    As atividades de aprovação aparecerão aqui
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historyEntries.map((entry) => {
                    const req = approvalRequests.find((r) => r.id === entry.approvalRequestId)
                    return (
                      <div key={entry.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                          entry.action === 'approved' ? 'bg-green-100 text-green-600' :
                          entry.action === 'rejected' ? 'bg-red-100 text-red-600' :
                          entry.action === 'cancelled' ? 'bg-slate-100 text-slate-500' :
                          'bg-amber-100 text-amber-600'
                        )}>
                          {entry.action === 'approved' ? <CheckCircle2 className="w-4 h-4" /> :
                           entry.action === 'rejected' ? <XCircle className="w-4 h-4" /> :
                           entry.action === 'cancelled' ? <XCircle className="w-4 h-4" /> :
                           <Clock className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-brand-navy">{entry.actorName}</span>
                            <span className="text-slate-400">
                              {entry.action === 'requested' ? 'solicitou aprovação' :
                               entry.action === 'approved' ? 'aprovou' :
                               entry.action === 'rejected' ? 'rejeitou' :
                               'cancelou'}
                            </span>
                            <span className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded-full font-bold border',
                              entry.action === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                              entry.action === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-slate-50 text-slate-500 border-slate-200'
                            )}>
                              {entry.action === 'approved' ? 'Aprovado' :
                               entry.action === 'rejected' ? 'Rejeitado' :
                               entry.action === 'cancelled' ? 'Cancelado' :
                               'Solicitado'}
                            </span>
                          </div>
                          {req && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] font-medium text-brand-navy">{req.sourceEnvName}</span>
                              <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                              <span className="text-[10px] font-medium text-brand-navy">{req.targetEnvName}</span>
                            </div>
                          )}
                          {entry.comment && (
                            <p className="text-xs text-slate-500 italic mt-1">"{entry.comment}"</p>
                          )}
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(entry.timestamp).toLocaleString('pt-BR')}
                            <span className="mx-1">·</span>
                            papel: {entry.role}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-brand-navy/90 transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
