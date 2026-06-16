import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Sparkles, Plus, X, Bolt, LayoutGrid, Trash2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCanvasStore } from '@/store/canvasStore'
import { allComponents } from './properties/providerDefinitions'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  suggestions?: string[]
}

// Architecture templates: name → list of component IDs to add
const TEMPLATES: Record<string, { label: string; components: string[]; edges?: [string, string][] }> = {
  'vpc-basico': {
    label: 'VPC Básica',
    components: ['aws-vpc', 'aws-subnet', 'aws-subnet', 'aws-igw', 'aws-rtb'],
    edges: [['aws-vpc', 'aws-subnet'], ['aws-vpc', 'aws-subnet'], ['aws-vpc', 'aws-igw'], ['aws-rtb', 'aws-subnet']],
  },
  'web-app-3-tier': {
    label: 'Web App 3 Camadas',
    components: ['aws-vpc', 'aws-subnet', 'aws-subnet', 'aws-alb', 'aws-ec2', 'aws-sg', 'aws-rds', 'aws-s3'],
    edges: [['aws-alb', 'aws-ec2'], ['aws-ec2', 'aws-rds'], ['aws-vpc', 'aws-subnet']],
  },
  'serverless-api': {
    label: 'API Serverless',
    components: ['aws-lambda', 'aws-dynamodb', 'aws-sqs', 'aws-sns', 'aws-s3'],
    edges: [['aws-lambda', 'aws-dynamodb'], ['aws-lambda', 'aws-sqs'], ['aws-sqs', 'aws-sns']],
  },
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'Oi! Posso ajudar a criar sua arquitetura na nuvem. Escolha um template ou descreva o que precisa.',
  suggestions: ['VPC básica', 'Web App 3 camadas', 'API Serverless', 'Adicionar um banco RDS', 'Organizar layout'],
}

function findComponents(query: string): { id: string; displayName: string; provider: string }[] {
  const q = query.toLowerCase()
  const results: { id: string; displayName: string; provider: string }[] = []

  // Direct resource type matches
  for (const c of allComponents) {
    if (c.displayName.toLowerCase().includes(q) || c.resourceType.toLowerCase().includes(q)) {
      results.push({ id: c.id, displayName: c.displayName, provider: c.provider })
    }
    if (results.length >= 3) break
  }
  return results
}

function detectIntent(input: string): 'template' | 'add' | 'layout' | 'clear' | 'unknown' {
  const lower = input.toLowerCase()
  if (lower.includes('vpc') || lower.includes('web app') || lower.includes('serverless') || lower.includes('3 camadas')) return 'template'
  if (lower.includes('adicionar') || lower.includes('add') || lower.includes('colocar') || lower.includes('criar')) return 'add'
  if (lower.includes('organizar') || lower.includes('layout') || lower.includes('arrumar')) return 'layout'
  if (lower.includes('limpar') || lower.includes('clear') || lower.includes('novo')) return 'clear'
  return 'unknown'
}

export function AIChatPanel({ onClose }: { onClose?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const addNode = useCanvasStore((s) => s.addNode)
  const autoLayout = useCanvasStore((s) => s.autoLayout)
  const clearCanvas = useCanvasStore((s) => s.clearCanvas)
  const addEdgeWithType = useCanvasStore((s) => s.addEdgeWithType)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const loadTemplate = useCallback(async (templateKey: string) => {
    const template = TEMPLATES[templateKey]
    if (!template) return

    const nodeIds: string[] = []
    for (const compId of template.components) {
      const comp = allComponents.find(c => c.id === compId)
      if (!comp) continue
      addNode(comp, { x: 200 + Math.random() * 400, y: 200 + Math.random() * 300 })
      const state = useCanvasStore.getState()
      const newNode = state.nodes[state.nodes.length - 1]
      if (newNode) nodeIds.push(newNode.id)
    }

    // Connect edges based on index mapping
    if (template.edges && nodeIds.length > 0) {
      for (const [srcIdx, tgtIdx] of template.edges) {
        // Find by component ID (not array index)
        const srcCompIdx = template.components.findIndex(c => c === srcIdx)
        const tgtCompIdx = template.components.findIndex(c => c === tgtIdx)
        if (srcCompIdx >= 0 && tgtCompIdx >= 0 && nodeIds[srcCompIdx] && nodeIds[tgtCompIdx]) {
          addEdgeWithType(nodeIds[srcCompIdx], nodeIds[tgtCompIdx], 'default')
        }
      }
    }

    // Auto-layout after nodes are added
    await new Promise(r => setTimeout(r, 100))
    await autoLayout()
  }, [addNode, addEdgeWithType, autoLayout])

  const addSingleComponent = useCallback(async (query: string) => {
    const matches = findComponents(query)
    if (matches.length === 0) {
      appendAssistant(
        `Não encontrei o componente "${query}". Tente algo como "VPC", "EC2", "RDS", "Lambda", "S3", "ALB".`,
      )
      return
    }

    for (const match of matches) {
      const comp = allComponents.find(c => c.id === match.id)
      if (comp) {
        addNode(comp, { x: 200 + Math.random() * 300, y: 200 + Math.random() * 200 })
      }
    }

    await new Promise(r => setTimeout(r, 50))
    appendAssistant(
      `Adicionei ${matches.length} componente(s) ao canvas.`,
      ['Organizar layout', 'Adicionar mais'],
    )
  }, [addNode])

  const appendAssistant = useCallback((content: string, suggestions?: string[]) => {
    const msg: Message = { id: crypto.randomUUID(), role: 'assistant', content, suggestions }
    setMessages(prev => [...prev, msg])
  }, [])

  const handleSend = useCallback(async () => {
    if (!input.trim()) return
    const userText = input.trim()
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: userText }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulate processing delay
    await new Promise(r => setTimeout(r, 800))

    try {
      const intent = detectIntent(userText)

      switch (intent) {
        case 'template': {
          const lower = userText.toLowerCase()
          let templateKey = ''
          if (lower.includes('vpc')) templateKey = 'vpc-basico'
          else if (lower.includes('web') || lower.includes('3')) templateKey = 'web-app-3-tier'
          else if (lower.includes('serverless')) templateKey = 'serverless-api'

          if (templateKey) {
            await loadTemplate(templateKey)
            const template = TEMPLATES[templateKey]
            appendAssistant(
              `Pronto! Criei uma arquitetura de **${template.label}** com ${template.components.length} componentes e conexões automáticas.`,
              ['Adicionar um banco RDS', 'Organizar layout', 'Exportar código'],
            )
          } else {
            appendAssistant(
              'Templates disponíveis: VPC básica, Web App 3 camadas, API Serverless.',
              ['VPC básica', 'Web App 3 camadas', 'API Serverless'],
            )
          }
          break
        }
        case 'add': {
          // Extract what to add after "adicionar"/"add" keywords
          const query = userText.replace(/^(adicione|adicionar|add|colocar|criar|um|uma|dois|duas|três)\s+/i, '').trim()
          await addSingleComponent(query || userText)
          break
        }
        case 'layout': {
          autoLayout()
          appendAssistant('Layout organizado automaticamente! ✅', ['Exportar código', 'Salvar design'])
          break
        }
        case 'clear': {
          clearCanvas()
          appendAssistant('Canvas limpo! Pronto para um novo design.', ['VPC básica', 'Web App 3 camadas', 'API Serverless'])
          break
        }
        default: {
          appendAssistant(
            'Não entendi. Posso ajudar com:\n\n' +
            '• **Templates**: "criar VPC", "web app 3 camadas", "API serverless"\n' +
            '• **Componentes**: "adicionar EC2", "colocar RDS", "criar Lambda"\n' +
            '• **Ações**: "organizar layout", "limpar canvas"\n' +
            '• **Exportar**: código Terraform no painel abaixo',
            ['VPC básica', 'Web App 3 camadas', 'API Serverless', 'Organizar layout'],
          )
          break
        }
      }
    } catch (err) {
      appendAssistant('Ocorreu um erro ao processar. Tente novamente.')
    } finally {
      setIsTyping(false)
    }
  }, [input, addSingleComponent, autoLayout, clearCanvas, loadTemplate, appendAssistant])

  const handleSuggestion = useCallback(async (suggestion: string) => {
    // Map suggestion text to template keys
    if (suggestion === 'VPC básica') {
      setInput('')
      setIsTyping(true)
      await new Promise(r => setTimeout(r, 300))
      await loadTemplate('vpc-basico')
      appendAssistant('Pronto! VPC básica criada com VPC, Subnets, Internet Gateway e Route Table.', ['Organizar layout', 'Adicionar EC2'])
      setIsTyping(false)
    } else if (suggestion === 'Web App 3 camadas') {
      setIsTyping(true)
      await new Promise(r => setTimeout(r, 300))
      await loadTemplate('web-app-3-tier')
      appendAssistant('Arquitetura 3 camadas criada! ALB → EC2 → RDS com Security Groups e S3.', ['Organizar layout', 'Exportar código'])
      setIsTyping(false)
    } else if (suggestion === 'API Serverless') {
      setIsTyping(true)
      await new Promise(r => setTimeout(r, 300))
      await loadTemplate('serverless-api')
      appendAssistant('API Serverless criada! Lambda → DynamoDB + SQS + SNS.', ['Organizar layout', 'Exportar código'])
      setIsTyping(false)
    } else if (suggestion === 'Organizar layout' || suggestion === 'Organizar layout') {
      autoLayout()
      appendAssistant('Layout organizado! ✅')
    } else if (suggestion === 'Exportar código') {
      appendAssistant('Abra o painel de código abaixo (ícone </>) para ver o Terraform gerado.')
    } else if (suggestion === 'Salvar design') {
      appendAssistant('Use ⌘S ou o botão de salvar na toolbar para salvar.')
    } else if (suggestion === 'Adicionar mais') {
      appendAssistant('O que mais deseja adicionar?', ['EC2', 'RDS', 'Lambda', 'S3', 'ALB'])
    } else if (suggestion === 'Adicionar um banco RDS') {
      const comp = allComponents.find(c => c.id === 'aws-rds')
      if (comp) {
        addNode(comp, { x: 500 + Math.random() * 100, y: 300 + Math.random() * 100 })
        await new Promise(r => setTimeout(r, 50))
      }
      appendAssistant('RDS Database adicionado ao canvas!', ['Organizar layout'])
    } else {
      // Treat as free text input
      setInput(suggestion)
      setTimeout(() => handleSend(), 100)
    }
  }, [loadTemplate, autoLayout, addNode, handleSend, appendAssistant])

  return (
    <div className="w-96 bg-white border-l border-slate-100 flex flex-col shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-white">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-lime/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand-navy" />
            </div>
            <h2 className="font-display font-bold text-lg text-brand-navy">Cloud AI</h2>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-brand-navy transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400 pl-9">Assistente de arquitetura inteligente</p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4 bg-slate-50/50">
          <div className="flex items-center justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">Hoje</span>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[85%] text-sm',
                msg.role === 'user'
                  ? 'bg-brand-navy text-white rounded-2xl rounded-br-sm p-3 shadow-md'
                  : 'bg-white border border-slate-200 rounded-2xl rounded-bl-sm p-4 shadow-sm'
              )}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-brand-lime" />
                    <span className="text-xs font-bold text-brand-navy">CloudBuilder AI</span>
                  </div>
                )}
                <p className={cn(msg.role === 'user' ? 'text-white' : 'text-slate-600', 'whitespace-pre-line')}>{msg.content}</p>

                {msg.suggestions && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {msg.suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSuggestion(s)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-700 border border-slate-100 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm p-3 shadow-sm flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-brand-lime rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-1.5 h-1.5 bg-brand-lime rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-1.5 h-1.5 bg-brand-lime rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy resize-none h-20 placeholder-slate-400 transition-all"
            placeholder="Ex: 'criar VPC' ou 'adicionar EC2'..."
          />
          <div className="absolute bottom-2 right-2 flex gap-1">
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-2 rounded-lg bg-brand-navy text-white hover:bg-brand-navy/90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between px-1">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Bolt className="w-2.5 h-2.5" /> Templates de arquitetura
          </span>
          <button
            onClick={() => setMessages([WELCOME_MESSAGE])}
            className="text-[10px] font-bold text-slate-500 hover:text-brand-navy uppercase tracking-wide"
          >
            Limpar Chat
          </button>
        </div>
      </div>
    </div>
  )
}
