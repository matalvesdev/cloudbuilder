import { useState, useEffect, useRef, useCallback } from 'react'
// @ts-ignore
import { FixedSizeList as List } from 'react-window'
import {
  FileText,
  Search,
  Filter,
  Loader2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSSE } from '@/hooks/useSSE'
import { observabilityApi } from '@/api/observability'
import type { LogEntryDTO } from '@/types/observability.types'

const LEVEL_COLORS: Record<string, string> = {
  ERROR: 'bg-red-100 text-red-700 border-red-200',
  WARN: 'bg-amber-100 text-amber-700 border-amber-200',
  INFO: 'bg-blue-100 text-blue-700 border-blue-200',
  DEBUG: 'bg-slate-100 text-slate-600 border-slate-200',
  TRACE: 'bg-slate-100 text-slate-400 border-slate-200',
}

const LEVEL_OPTIONS = ['ALL', 'ERROR', 'WARN', 'INFO', 'DEBUG']
const ITEM_HEIGHT = 40
const MAX_LOGS = 1000

export function LogViewer() {
  const [logs, setLogs] = useState<LogEntryDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [levelFilter, setLevelFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<List>(null)

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await observabilityApi.listLogs()
      setLogs(Array.isArray(data) ? data.slice(0, MAX_LOGS) : [])
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadLogs() }, [loadLogs])

  const { data: streamData } = useSSE('/api/v1/observability/logs/stream', 'log')
  useEffect(() => {
    if (streamData) {
      setLogs((prev) => [streamData as LogEntryDTO, ...prev].slice(0, MAX_LOGS))
    }
  }, [streamData])

  const filteredLogs = logs.filter((log) => {
    if (levelFilter !== 'ALL' && log.level !== levelFilter) return false
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const log = filteredLogs[index]
    if (!log) return null
    const isExpanded = expandedLog === `${index}`

    return (
      <div style={style} className="border-b border-slate-100">
        <button
          onClick={() => setExpandedLog(isExpanded ? null : `${index}`)}
          className="w-full flex items-start gap-3 p-3 text-left hover:bg-slate-50"
        >
          <span className="text-slate-400 whitespace-nowrap">
            {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
          </span>
          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', LEVEL_COLORS[log.level] || LEVEL_COLORS.INFO)}>
            {log.level}
          </Badge>
          <span className="flex-1 text-slate-700 truncate">{log.message}</span>
          <span className="text-slate-400 whitespace-nowrap">{log.loggerName?.split('.').pop()}</span>
          {log.stackTrace && (
            isExpanded
              ? <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
              : <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
          )}
        </button>
        {isExpanded && log.stackTrace && (
          <pre className="px-3 pb-3 text-red-600 text-[10px] whitespace-pre-wrap ml-4">
            {log.stackTrace}
          </pre>
        )}
      </div>
    )
  }, [filteredLogs, expandedLog])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5 text-brand-navy" />
        <h2 className="text-lg font-bold text-brand-navy font-display">Visualizador de Logs</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar nos logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-32">
            <Filter className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LEVEL_OPTIONS.map((level) => (
              <SelectItem key={level} value={level}>{level}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={loadLogs}>
          <Loader2 className="h-4 w-4 mr-1" />
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum log encontrado</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 card-shadow overflow-hidden font-mono text-xs">
          <List
            ref={listRef}
            height={600}
            itemCount={filteredLogs.length}
            itemSize={ITEM_HEIGHT}
            width="100%"
          >
            {Row}
          </List>
        </div>
      )}
    </div>
  )
}
