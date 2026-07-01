import { useState, useCallback } from 'react'
import {
  Bell, BellOff, Check, CheckCheck, Trash2, Filter, Loader2, Search,
  AlertTriangle, Info, CheckCircle, XCircle, Clock, Settings, Eye, EyeOff,
} from 'lucide-react'
import { showSuccess } from '@/lib/toast'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Local notification type (no backend endpoint yet)
interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  read: boolean
  createdAt: string
}

const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Deploy concluído',
    message: 'O ambiente staging foi atualizado com sucesso via pipeline #42.',
    type: 'success',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: '2',
    title: 'Drift detectado',
    message: 'Recurso aws_instance.web (i-0abc123) apresentou drift na região us-east-1.',
    type: 'warning',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '3',
    title: 'Erro no provisionamento',
    message: 'Falha ao criar RDS PostgreSQL no template vpc-prod. Verifique os logs.',
    type: 'error',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '4',
    title: 'Novo membro adicionado',
    message: 'carla@acme.com foi adicionada ao workspace como Admin.',
    type: 'info',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: '5',
    title: 'Budget ultrapassado',
    message: 'O custo do ambiente production atingiu 95% do orçamento mensal.',
    type: 'warning',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

const typeIcon = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  success: CheckCircle,
}

const typeColor = {
  info: 'text-blue-500 bg-blue-50',
  warning: 'text-yellow-500 bg-yellow-50',
  error: 'text-red-500 bg-red-50',
  success: 'text-green-500 bg-green-50',
}

const typeLabel = {
  info: 'Informação',
  warning: 'Aviso',
  error: 'Erro',
  success: 'Sucesso',
}

export function NotificationsModule() {
  const [notifications, setNotifications] = useState<Notification[]>(SEED_NOTIFICATIONS)
  const [activeTab, setActiveTab] = useState('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showRead, setShowRead] = useState(true)

  // ─── Actions ───────────────────────────────────────────────

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    showSuccess('Todas as notificações marcadas como lidas')
  }, [])

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
    showSuccess('Todas as notificações removidas')
  }, [])

  // ─── Filtered list ─────────────────────────────────────────

  const filtered = notifications.filter(n => {
    if (!showRead && n.read) return false
    if (typeFilter !== 'all' && n.type !== typeFilter) return false
    if (activeTab === 'unread' && n.read) return false
    if (activeTab === 'read' && !n.read) return false
    if (search) {
      const q = search.toLowerCase()
      return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q)
    }
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length
  const cellCls = 'px-4 py-3 text-sm'

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy font-display">Notificações</h1>
          <p className="text-sm text-slate-400">Centro de notificações e alertas</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-xs"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="w-3.5 h-3.5 mr-1" />
            Marcar todas como lidas
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-xs text-red-500 border-red-200 hover:bg-red-50"
            onClick={clearAll}
            disabled={notifications.length === 0}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Limpar tudo
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 card-shadow border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-ice-blue p-3">
              <Bell className="h-5 w-5 text-brand-navy" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Total</p>
              <p className="text-2xl font-bold text-brand-navy">{notifications.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 card-shadow border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-yellow-50 p-3">
              <BellOff className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Não lidas</p>
              <p className="text-2xl font-bold text-yellow-600">{unreadCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 card-shadow border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-50 p-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Sucesso</p>
              <p className="text-2xl font-bold text-green-600">{notifications.filter(n => n.type === 'success').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 card-shadow border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-50 p-3">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Erros</p>
              <p className="text-2xl font-bold text-red-600">{notifications.filter(n => n.type === 'error').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-lime"
            placeholder="Buscar notificação..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 rounded-xl">
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="info">Informação</SelectItem>
            <SelectItem value="warning">Aviso</SelectItem>
            <SelectItem value="error">Erro</SelectItem>
            <SelectItem value="success">Sucesso</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-slate-400 hover:text-brand-navy"
          onClick={() => setShowRead(!showRead)}
        >
          {showRead ? <Eye className="w-3.5 h-3.5 mr-1" /> : <EyeOff className="w-3.5 h-3.5 mr-1" />}
          {showRead ? 'Ocultar lidas' : 'Mostrar lidas'}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border border-slate-200 rounded-xl p-1">
          <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-brand-navy data-[state=active]:text-white">
            Todas
          </TabsTrigger>
          <TabsTrigger value="unread" className="rounded-lg data-[state=active]:bg-brand-navy data-[state=active]:text-white">
            Não lidas ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="read" className="rounded-lg data-[state=active]:bg-brand-navy data-[state=active]:text-white">
            Lidas
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="bg-white rounded-2xl card-shadow border border-slate-100 overflow-hidden">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-sm text-slate-400">
                <BellOff className="w-8 h-8 mb-2" />
                {search ? 'Nenhuma notificação encontrada' : 'Nenhuma notificação'}
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filtered.map(n => {
                  const Icon = typeIcon[n.type]
                  const colors = typeColor[n.type]
                  return (
                    <div
                      key={n.id}
                      className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                        n.read ? 'bg-white' : 'bg-ice-blue/10'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colors}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-bold ${n.read ? 'text-slate-500' : 'text-brand-navy'}`}>
                            {n.title}
                          </p>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-brand-lime flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] text-slate-300 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo(n.createdAt)}
                          </span>
                          <span className={`text-[10px] font-medium ${colors.split(' ')[0]}`}>
                            {typeLabel[n.type]}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!n.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-slate-400 hover:text-brand-navy"
                            onClick={() => markAsRead(n.id)}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => deleteNotification(n.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
