import { useState, useRef, useEffect } from 'react'
import { Terminal } from 'lucide-react'

interface ConsoleCommand {
  input: string
  output: string
  timestamp: Date
}

interface CanvasConsolePanelProps {
  canvasId?: string
}

/**
 * CanvasConsolePanel: Interactive console in the canvas bottom panel.
 * Allows running quick commands against the canvas infrastructure.
 */
export function CanvasConsolePanel({ canvasId }: CanvasConsolePanelProps) {
  const [history, setHistory] = useState<ConsoleCommand[]>([])
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history])

  const execute = () => {
    if (!input.trim()) return
    const cmd = input.trim().toLowerCase()
    let output = ''

    if (cmd === 'help') {
      output = 'Comandos disponíveis: help, status, nodes, edges, clear, version'
    } else if (cmd === 'status') {
      output = `Canvas: ${canvasId || 'N/A'}\nStatus: Ativo`
    } else if (cmd === 'nodes') {
      output = 'Use o painel de propriedades para ver nós do canvas'
    } else if (cmd === 'edges') {
      output = 'Use o painel de propriedades para ver conexões do canvas'
    } else if (cmd === 'clear') {
      setHistory([])
      setInput('')
      return
    } else if (cmd === 'version') {
      output = 'CloudBuilder Console v1.0'
    } else {
      output = `Comando não reconhecido: ${input}. Digite "help" para ajuda.`
    }

    setHistory(prev => [...prev, { input, output, timestamp: new Date() }])
    setInput('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-200">
        <Terminal className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-xs font-medium text-slate-500">Console</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-2">
        {history.length === 0 && (
          <div className="text-slate-400">CloudBuilder Console. Digite "help" para ajuda.</div>
        )}
        {history.map((entry, i) => (
          <div key={i}>
            <div className="text-brand-navy">
              <span className="text-slate-400">$</span> {entry.input}
            </div>
            <div className="text-slate-600 whitespace-pre-wrap">{entry.output}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-200">
        <span className="text-slate-400 text-xs">$</span>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && execute()}
          placeholder="Digite um comando..."
          className="flex-1 text-xs font-mono bg-transparent outline-none"
        />
      </div>
    </div>
  )
}
