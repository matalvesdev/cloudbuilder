import { useState, useEffect, useMemo } from 'react'
import {
  X,
  Share2,
  MessageSquare,
  Clock,
  Check,
  UserPlus,
  Send,
  Trash2,
  RotateCcw,
  Users,
  Mail,
  Link,
  FileText,
  MessageCircle,
  Plug,
  PlugZap,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCollaborationStore } from '@/store/collaborationStore'
import { useCanvasStore } from '@/store/canvasStore'
import { collaborationManager } from '@/services/collaborationManager'
import type { TeamMember, TeamMemberRole, VersionEntry } from '@/types/collaboration.types'

type PanelTab = 'compartilhar' | 'comentarios' | 'historico'

const AVATAR_COLORS: Record<string, string> = {
  T: '#3b82f6',
  A: '#f97316',
  P: '#8b5cf6',
  C: '#22c55e',
}

function getAvatarColor(name: string): string {
  if (AVATAR_COLORS[name.charAt(0).toUpperCase()]) return AVATAR_COLORS[name.charAt(0).toUpperCase()]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const colors = ['#3b82f6', '#f97316', '#8b5cf6', '#22c55e', '#ec4899', '#14b8a6', '#eab308', '#6366f1']
  return colors[Math.abs(hash) % colors.length]
}

const ROLE_BADGE: Record<TeamMemberRole, { label: string; className: string }> = {
  owner: { label: 'Proprietário', className: 'bg-amber-100 text-amber-700' },
  editor: { label: 'Editor', className: 'bg-blue-100 text-blue-700' },
  viewer: { label: 'Visualizador', className: 'bg-slate-100 text-slate-600' },
}

const STATUS_DOT: Record<string, string> = {
  online: 'bg-green-500',
  away: 'bg-amber-400',
  offline: 'bg-slate-300',
}

function CompartilharSection() {
  const { teamMembers, inviteMember, removeMember, generateShareLink } = useCollaborationStore()
  const { canvasId, canvasName } = useCanvasStore()
  const [inviteEmail, setInviteEmail] = useState('')
  const [copied, setCopied] = useState(false)
  const [serverUrl, setServerUrl] = useState(
    () => import.meta.env.VITE_COLLAB_WS_URL || 'ws://localhost:8765',
  )
  const [connected, setConnected] = useState(false)
  const [showConnect, setShowConnect] = useState(false)

  useEffect(() => {
    setConnected(collaborationManager.isConnected())
    const interval = setInterval(() => {
      setConnected(collaborationManager.isConnected())
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleToggleConnection = () => {
    if (connected) {
      collaborationManager.stop()
      setConnected(false)
    } else {
      const userId = `user-${Date.now().toString(36)}`
      collaborationManager.start(
        canvasId || 'design-atual',
        serverUrl,
        { id: userId, name: 'Você', avatar: 'V' },
      )
      setConnected(true)
    }
  }

  const handleCopyLink = () => {
    const token = generateShareLink(canvasId || 'design-atual', 'user-atual')
    const url = `${window.location.origin}/design/compartilhado/${token}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleInvite = () => {
    if (!inviteEmail.trim()) return
    const name = inviteEmail.split('@')[0]
    inviteMember(name, inviteEmail.trim(), 'editor')
    setInviteEmail('')
  }

  const onlineCount = teamMembers.filter((m) => m.status === 'online').length

  return (
    <div className="space-y-5">
      {/* Conexão em tempo real */}
      <div className={cn(
        'rounded-xl border p-3 space-y-3 transition-colors',
        connected ? 'border-green-200 bg-green-50/50' : 'border-slate-200 bg-slate-50/50',
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {connected ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-slate-400" />
            )}
            <span className={cn(
              'text-sm font-semibold',
              connected ? 'text-green-700' : 'text-slate-500',
            )}>
              {connected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          <Button
            size="sm"
            variant={connected ? 'outline' : 'default'}
            className={cn(
              'h-7 text-[10px] px-2.5 rounded-lg gap-1',
              connected
                ? 'border-red-200 text-red-600 hover:bg-red-50'
                : 'bg-brand-navy hover:bg-brand-navy/90 text-white',
            )}
            onClick={handleToggleConnection}
          >
            {connected ? (
              <><PlugZap className="w-3 h-3" /> Desconectar</>
            ) : (
              <><Plug className="w-3 h-3" /> Conectar</>
            )}
          </Button>
        </div>

        {!connected && showConnect && (
          <div className="flex gap-2">
            <Input
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="ws://localhost:8765"
              className="h-8 text-xs rounded-lg flex-1"
            />
          </div>
        )}
        {!connected && !showConnect && (
          <button
            onClick={() => setShowConnect(true)}
            className="text-[10px] text-blue-600 hover:text-blue-800"
          >
            Configurar servidor
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Users className="w-4 h-4" />
        <span className="font-medium">{teamMembers.length} membro(s)</span>
        <span className="text-slate-300">·</span>
        <span className="text-green-600 font-medium">{onlineCount} online</span>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Membros da equipe</p>
        <div className="space-y-1.5">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-slate-50 group">
              <div className="relative shrink-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: getAvatarColor(member.name) }}
                >
                  {member.avatar}
                </div>
                <div className={cn('absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white', STATUS_DOT[member.status])} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-brand-navy truncate">{member.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{member.email}</p>
              </div>
              <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase', ROLE_BADGE[member.role].className)}>
                {ROLE_BADGE[member.role].label}
              </span>
              {member.role !== 'owner' && (
                <button
                  onClick={() => removeMember(member.id)}
                  className="shrink-0 p-1 rounded hover:bg-red-100 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Convidar membro</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="pl-8 h-8 text-xs rounded-lg"
              onKeyDown={(e) => { if (e.key === 'Enter') handleInvite() }}
            />
          </div>
          <Button
            size="sm"
            variant="default"
            className="h-8 px-3 text-xs rounded-lg bg-brand-navy hover:bg-brand-navy/90 text-white"
            disabled={!inviteEmail.trim()}
            onClick={handleInvite}
          >
            <UserPlus className="w-3.5 h-3.5 mr-1" />
            Convidar
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Compartilhar link</p>
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs rounded-lg justify-start gap-2 border-slate-200 hover:bg-slate-50"
          onClick={handleCopyLink}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-600" />
          ) : (
            <Link className="w-3.5 h-3.5 text-slate-400" />
          )}
          {copied ? 'Link copiado!' : 'Copiar link de compartilhamento'}
        </Button>
      </div>
    </div>
  )
}

function ComentariosSection() {
  const {
    comments,
    addComment,
    resolveComment,
    selectedCommentNodeId,
    setSelectedCommentNodeId,
  } = useCollaborationStore()
  const { nodes, selectedNode } = useCanvasStore()
  const [newComment, setNewComment] = useState('')
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)

  useEffect(() => {
    if (selectedCommentNodeId) {
      setActiveNodeId(selectedCommentNodeId)
      setSelectedCommentNodeId(null)
    }
  }, [selectedCommentNodeId, setSelectedCommentNodeId])

  useEffect(() => {
    if (selectedNode) setActiveNodeId(selectedNode)
  }, [selectedNode])

  const filteredComments = useMemo(() => {
    if (!activeNodeId) return comments.filter((c) => !c.resolved)
    return comments.filter((c) => c.nodeId === activeNodeId && !c.resolved)
  }, [comments, activeNodeId])

  const handleSend = () => {
    if (!newComment.trim()) return
    addComment(activeNodeId, 'current-user', 'Você', 'V', newComment.trim())
    setNewComment('')
  }

  const activeNodeLabel = activeNodeId
    ? nodes.find((n) => n.id === activeNodeId)?.data?.label || 'Nó selecionado'
    : null

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-3 flex-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {activeNodeId ? `Comentários do nó` : 'Todos os comentários'}
          </p>
          {activeNodeId && (
            <button
              onClick={() => setActiveNodeId(null)}
              className="text-[10px] text-blue-600 hover:text-blue-800 font-medium"
            >
              Ver todos
            </button>
          )}
        </div>

        {activeNodeLabel && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-ice-blue rounded-lg">
            <FileText className="w-3 h-3 text-brand-navy/60" />
            <span className="text-xs font-medium text-brand-navy truncate">{activeNodeLabel}</span>
            <button onClick={() => setActiveNodeId(null)} className="ml-auto text-slate-400 hover:text-slate-600">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {filteredComments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
            <MessageCircle className="w-8 h-8" />
            <p className="text-xs">Nenhum comentário ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredComments.map((comment) => (
              <div key={comment.id} className="flex gap-2.5 group">
                <div
                  className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white mt-0.5"
                  style={{ backgroundColor: getAvatarColor(comment.authorName) }}
                >
                  {comment.authorAvatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-brand-navy">{comment.authorName}</span>
                    <span className="text-[9px] text-slate-400 shrink-0">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mt-0.5">{comment.content}</p>
                  <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => resolveComment(comment.id)}
                      className="text-[10px] text-green-600 hover:text-green-800 font-medium"
                    >
                      Resolver
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 mt-3">
        <div className="flex gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={activeNodeId ? 'Comentário para este nó...' : 'Adicionar comentário...'}
            className="h-9 text-xs rounded-lg flex-1"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          />
          <Button
            size="sm"
            className="h-9 w-9 p-0 rounded-lg bg-brand-navy hover:bg-brand-navy/90 text-white shrink-0"
            disabled={!newComment.trim()}
            onClick={handleSend}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
        {!activeNodeId && (
          <p className="text-[9px] text-slate-400 mt-1.5">
            Selecione um nó para comentar sobre ele, ou comente aqui para um comentário geral.
          </p>
        )}
      </div>
    </div>
  )
}

function HistoricoSection() {
  const [versions, setVersions] = useState<VersionEntry[]>([])
  const [restoring, setRestoring] = useState<string | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cloudbuilder-canvas-history')
      if (stored) {
        const all: VersionEntry[] = JSON.parse(stored)
        setVersions(all.slice(0, 5))
      }
    } catch {}
  }, [])

  const handleRestore = (version: number) => {
    setRestoring(`v${version}`)
    try {
      const stored = localStorage.getItem(`cloudbuilder-canvas-v${version}`)
      if (stored) {
        const design = JSON.parse(stored)
        const store = useCanvasStore.getState()
        store.loadCanvas(design)
      }
    } catch {}
    setTimeout(() => setRestoring(null), 1000)
  }

  const handleSaveNew = () => {
    const store = useCanvasStore.getState()
    const newVersion = (store.canvasVersion || 1) + 1
    const design = {
      id: store.canvasId || crypto.randomUUID(),
      name: store.canvasName,
      version: newVersion,
      nodes: store.nodes,
      edges: store.edges,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(`cloudbuilder-canvas-v${newVersion}`, JSON.stringify(design))
    const historyKey = 'cloudbuilder-canvas-history'
    try {
      const stored = localStorage.getItem(historyKey)
      const history = stored ? JSON.parse(stored) : []
      const entry = {
        id: crypto.randomUUID(),
        version: newVersion,
        name: store.canvasName || 'Design sem título',
        nodeCount: store.nodes.length,
        edgeCount: store.edges.length,
        savedAt: new Date().toISOString(),
      }
      const updated = [entry, ...history.filter((h: any) => h.version !== newVersion)].slice(0, 20)
      localStorage.setItem(historyKey, JSON.stringify(updated))
      setVersions(updated.slice(0, 5))
    } catch {}
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Últimas versões</p>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[10px] rounded-lg border-slate-200"
          onClick={handleSaveNew}
        >
          Salvar nova versão
        </Button>
      </div>

      {versions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
          <Clock className="w-8 h-8" />
          <p className="text-xs">Nenhuma versão salva</p>
          <p className="text-[10px] text-slate-300">Salve o design para criar um snapshot</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {versions.map((v) => (
            <div
              key={v.id}
              className="flex items-center gap-3 py-2 px-2.5 rounded-lg hover:bg-slate-50 group transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-brand-navy/10 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-brand-navy">v{v.version}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-brand-navy truncate">{v.name}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span>{formatTimeAgo(v.savedAt)}</span>
                  <span>·</span>
                  <span>{v.nodeCount} nós</span>
                  {v.edgeCount > 0 && (
                    <>
                      <span>·</span>
                      <span>{v.edgeCount} conexões</span>
                    </>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-7 text-[10px] px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all',
                  restoring === `v${v.version}`
                    ? 'text-green-600 opacity-100'
                    : 'text-slate-500 hover:text-brand-navy hover:bg-slate-100'
                )}
                onClick={() => handleRestore(v.version)}
                disabled={restoring === `v${v.version}`}
              >
                {restoring === `v${v.version}` ? (
                  <Check className="w-3 h-3 mr-1" />
                ) : (
                  <RotateCcw className="w-3 h-3 mr-1" />
                )}
                {restoring === `v${v.version}` ? 'Restaurado' : 'Restaurar'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Agora mesmo'
  if (mins < 60) return `há ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days}d`
}

export function CollaborationPanel({ onClose }: { onClose?: () => void }) {
  const [activeTab, setActiveTab] = useState<PanelTab>('comentarios')
  const { teamMembers } = useCollaborationStore()
  const onlineMembers = teamMembers.filter((m) => m.status === 'online')
  const { comments } = useCollaborationStore()
  const unresolvedCount = comments.filter((c) => !c.resolved).length
  const { selectedCommentNodeId } = useCollaborationStore()

  useEffect(() => {
    if (selectedCommentNodeId) setActiveTab('comentarios')
  }, [selectedCommentNodeId])

  const tabs: { id: PanelTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'compartilhar', label: 'Compartilhar', icon: <Share2 className="w-3.5 h-3.5" /> },
    { id: 'comentarios', label: 'Comentários', icon: <MessageSquare className="w-3.5 h-3.5" />, badge: unresolvedCount || undefined },
    { id: 'historico', label: 'Histórico', icon: <Clock className="w-3.5 h-3.5" /> },
  ]

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex -space-x-1.5">
              {onlineMembers.slice(0, 3).map((m) => (
                <div
                  key={m.id}
                  className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[7px] font-bold text-white"
                  style={{ backgroundColor: getAvatarColor(m.name) }}
                  title={m.name}
                >
                  {m.avatar}
                </div>
              ))}
              {onlineMembers.length > 3 && (
                <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[7px] font-bold text-slate-500">
                  +{onlineMembers.length - 3}
                </div>
              )}
            </div>
            <div>
              <h2 className="font-bold text-sm text-brand-navy uppercase tracking-wider">Colaboração</h2>
              <p className="text-[9px] text-slate-400">{onlineMembers.length} online</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded text-slate-400">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 justify-center',
                activeTab === tab.id
                  ? 'bg-brand-navy text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={cn(
                  'w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold',
                  activeTab === tab.id ? 'bg-brand-lime text-brand-navy' : 'bg-slate-200 text-slate-600'
                )}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {activeTab === 'compartilhar' && <CompartilharSection />}
          {activeTab === 'comentarios' && <ComentariosSection />}
          {activeTab === 'historico' && <HistoricoSection />}
        </div>
      </ScrollArea>
    </div>
  )
}
