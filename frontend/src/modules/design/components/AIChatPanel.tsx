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

// Grid → position helper: places components in a 2-column grid with labels per column
const GRID_COLS = 2
const GRID_COL_WIDTH = 280
const GRID_ROW_HEIGHT = 80
const GRID_ORIGIN_X = 50
const GRID_ORIGIN_Y = 50

// Category → column index for grid layout
const CATEGORY_COLUMN: Record<string, number> = {
  network: 0,
  compute: 0,
  security: 0,
  database: 1,
  storage: 1,
  serverless: 1,
  integration: 1,
  monitoring: 1,
}

function getGridPosition(category: string, offset: number): { x: number; y: number } {
  const col = CATEGORY_COLUMN[category] ?? (offset % GRID_COLS)
  const row = Math.floor(offset / GRID_COLS)
  return {
    x: GRID_ORIGIN_X + col * GRID_COL_WIDTH,
    y: GRID_ORIGIN_Y + row * GRID_ROW_HEIGHT,
  }
}

// Architecture templates with grid-aware positions
const TEMPLATES: Record<string, { label: string; components: string[]; edges?: [string, string][] }> = {
  'vpc-basico': {
    label: 'VPC Básica',
    components: ['aws-vpc', 'aws-subnet', 'aws-subnet', 'aws-igw', 'aws-rtb'],
    edges: [['aws-vpc', 'aws-subnet'], ['aws-vpc', 'aws-subnet'], ['aws-vpc', 'aws-igw'], ['aws-rtb', 'aws-subnet']],
  },
  'web-app-3-tier': {
    label: 'Web App 3 Camadas',
    components: ['aws-vpc', 'aws-subnet', 'aws-subnet', 'aws-alb', 'aws-sg', 'aws-ec2', 'aws-rds', 'aws-s3'],
    edges: [['aws-vpc', 'aws-subnet'], ['aws-vpc', 'aws-subnet'], ['aws-alb', 'aws-ec2'], ['aws-sg', 'aws-ec2'], ['aws-sg', 'aws-rds'], ['aws-ec2', 'aws-rds'], ['aws-ec2', 'aws-s3']],
  },
  'serverless-api': {
    label: 'API Serverless',
    components: ['aws-lambda', 'aws-dynamodb', 'aws-sqs', 'aws-sns', 'aws-s3'],
    edges: [['aws-lambda', 'aws-dynamodb'], ['aws-lambda', 'aws-sqs'], ['aws-sqs', 'aws-sns']],
  },
  'microservices-aws': {
    label: 'Microserviços AWS (ECS)',
    components: ['aws-vpc', 'aws-subnet', 'aws-alb', 'aws-ecs', 'aws-ecr', 'aws-rds', 'aws-elasticache', 'aws-sqs', 'aws-s3'],
    edges: [['aws-vpc', 'aws-subnet'], ['aws-alb', 'aws-ecs'], ['aws-ecs', 'aws-rds'], ['aws-ecs', 'aws-elasticache'], ['aws-ecs', 'aws-sqs'], ['aws-ecr', 'aws-ecs']],
  },
  'k8s-eks': {
    label: 'Kubernetes AWS (EKS)',
    components: ['aws-vpc', 'aws-subnet', 'aws-ecr', 'aws-alb', 'aws-ec2', 'aws-rds', 'aws-s3', 'aws-cw'],
    edges: [['aws-vpc', 'aws-subnet'], ['aws-alb', 'aws-ec2'], ['aws-ec2', 'aws-rds'], ['aws-ec2', 'aws-s3'], ['aws-ec2', 'aws-cw'], ['aws-ecr', 'aws-ec2']],
  },
  'azure-infra': {
    label: 'Infraestrutura Azure',
    components: ['azure-vnet', 'azure-subnet', 'azure-appgw', 'azure-vm', 'azure-sql', 'azure-storage', 'azure-func', 'azure-nsg'],
    edges: [['azure-vnet', 'azure-subnet'], ['azure-vnet', 'azure-nsg'], ['azure-appgw', 'azure-vm'], ['azure-vm', 'azure-sql'], ['azure-vm', 'azure-storage'], ['azure-vm', 'azure-func']],
  },
  'gcp-native': {
    label: 'GCP Cloud Native',
    components: ['gcp-vpc', 'gcp-subnet', 'gcp-gke', 'gcp-vm', 'gcp-sql', 'gcp-gcs', 'gcp-cloudrun'],
    edges: [['gcp-vpc', 'gcp-subnet'], ['gcp-gke', 'gcp-vm'], ['gcp-vm', 'gcp-sql'], ['gcp-vm', 'gcp-gcs'], ['gcp-cloudrun', 'gcp-sql']],
  },
  'k8s-production': {
    label: 'Kubernetes Produção',
    components: ['k8s-namespace', 'k8s-deploy', 'k8s-service', 'k8s-ingress', 'k8s-configmap', 'k8s-secret', 'k8s-pvc', 'k8s-hpa'],
    edges: [['k8s-namespace', 'k8s-deploy'], ['k8s-namespace', 'k8s-configmap'], ['k8s-namespace', 'k8s-secret'], ['k8s-deploy', 'k8s-service'], ['k8s-service', 'k8s-ingress'], ['k8s-deploy', 'k8s-hpa'], ['k8s-deploy', 'k8s-pvc']],
  },
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'Oi! Posso ajudar a criar sua arquitetura na nuvem. Escolha um template ou descreva o que precisa.',
  suggestions: [
    'VPC básica', 'Web App 3 camadas', 'API Serverless', 'Microserviços AWS',
    'Kubernetes AWS (EKS)', 'Infra Azure', 'GCP Cloud Native', 'K8s Produção',
  ],
}

const CATEGORY_ALIASES: Record<string, string[]> = {
  compute: ['vm', 'instância', 'instancia', 'servidor', 'compute', 'ec2', 'k8s', 'kubernetes', 'container', 'cluster'],
  database: ['banco', 'db', 'database', 'sql', 'rds', 'cache', 'elasticache', 'dynamodb', 'redis'],
  network: ['rede', 'vpc', 'subnet', 'dns', 'load balancer', 'alb', 'firewall', 'gateway'],
  storage: ['armazenamento', 'storage', 'bucket', 's3', 'disco', 'volume', 'efs', 'ebs'],
  serverless: ['lambda', 'function', 'serverless', 'cloud run', 'function app', 'função'],
  security: ['segurança', 'security', 'firewall', 'sg', 'nsg', 'grupo de segurança', 'iam'],
  integration: ['fila', 'queue', 'sqs', 'sns', 'mensageria', 'api', 'pubsub', 'event'],
  monitoring: ['monitoramento', 'alarme', 'cloudwatch', 'grafana', 'metrics', 'log'],
}

function findComponents(query: string): { id: string; displayName: string; provider: string }[] {
  const q = query.toLowerCase()
  const results: { id: string; displayName: string; provider: string }[] = []
  const seen = new Set<string>()

  // Check for category aliases first
  for (const [category, aliases] of Object.entries(CATEGORY_ALIASES)) {
    if (aliases.some(a => q.includes(a))) {
      const categoryMatches = allComponents.filter(c => c.category === category)
      for (const c of categoryMatches.slice(0, 5)) {
        if (!seen.has(c.id)) {
          seen.add(c.id)
          results.push({ id: c.id, displayName: c.displayName, provider: c.provider })
        }
      }
      return results
    }
  }

  // Direct displayName / resourceType / provider matches
  for (const c of allComponents) {
    if (c.displayName.toLowerCase().includes(q) || c.resourceType.toLowerCase().includes(q) || c.provider.includes(q)) {
      if (!seen.has(c.id)) {
        seen.add(c.id)
        results.push({ id: c.id, displayName: c.displayName, provider: c.provider })
      }
    }
    if (results.length >= 5) break
  }
  return results
}

const TEMPLATE_KEYWORDS: [string, string][] = [
  ['vpc-basico', 'vpc'],
  ['web-app-3-tier', '3 camadas'],
  ['web-app-3-tier', 'web app'],
  ['web-app-3-tier', 'webapp'],
  ['serverless-api', 'serverless'],
  ['microservices-aws', 'microserviço'],
  ['microservices-aws', 'ecs'],
  ['k8s-eks', 'eks'],
  ['k8s-eks', 'kubernetes aws'],
  ['azure-infra', 'azure'],
  ['azure-infra', 'azurerm'],
  ['gcp-native', 'gcp'],
  ['gcp-native', 'google cloud'],
  ['k8s-production', 'k8s produção'],
  ['k8s-production', 'kubernetes produção'],
]

function detectIntent(input: string): 'template' | 'add' | 'layout' | 'clear' | 'unknown' {
  const lower = input.toLowerCase()
  if (TEMPLATE_KEYWORDS.some(([_, kw]) => lower.includes(kw))) return 'template'
  if (lower.includes('adicionar') || lower.includes('add') || lower.includes('colocar') || lower.includes('criar') || lower.includes('inserir')) return 'add'
  if (lower.includes('organizar') || lower.includes('layout') || lower.includes('arrumar') || lower.includes('auto')) return 'layout'
  if (lower.includes('limpar') || lower.includes('clear') || lower.includes('novo') || lower.includes('reiniciar')) return 'clear'
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
    const countByCategory: Record<string, number> = {}
    for (const compId of template.components) {
      const comp = allComponents.find(c => c.id === compId)
      if (!comp) continue
      const cat = comp.category || 'compute'
      const offset = countByCategory[cat] ?? 0
      countByCategory[cat] = offset + 1
      addNode(comp, getGridPosition(cat, offset))
      const state = useCanvasStore.getState()
      const newNode = state.nodes[state.nodes.length - 1]
      if (newNode) nodeIds.push(newNode.id)
    }

    // Connect edges based on index mapping
    if (template.edges && nodeIds.length > 0) {
      for (const [srcIdx, tgtIdx] of template.edges) {
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

    const countByCategory: Record<string, number> = {}
    for (const match of matches) {
      const comp = allComponents.find(c => c.id === match.id)
      if (comp) {
        const cat = comp.category || 'compute'
        const offset = countByCategory[cat] ?? 0
        countByCategory[cat] = offset + 1
        addNode(comp, getGridPosition(cat, offset))
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
          const matched = TEMPLATE_KEYWORDS.find(([_, kw]) => lower.includes(kw))
          const templateKey = matched ? matched[0] : ''

          if (templateKey && TEMPLATES[templateKey]) {
            await loadTemplate(templateKey)
            const template = TEMPLATES[templateKey]
            appendAssistant(
              `Pronto! Criei uma arquitetura de **${template.label}** com ${template.components.length} componentes e conexões automáticas.`,
              ['Organizar layout', 'Exportar código', 'Adicionar mais'],
            )
          } else {
            appendAssistant(
              'Templates disponíveis:\n\n' +
              '• **AWS**: VPC básica, Web App 3 camadas, API Serverless, Microserviços (ECS), Kubernetes (EKS)\n' +
              '• **Azure**: Infraestrutura completa\n' +
              '• **GCP**: Cloud Native\n' +
              '• **Kubernetes**: Produção (Deployments, Services, Ingress)',
              ['VPC básica', 'Web App 3 camadas', 'Microserviços AWS', 'Infra Azure', 'GCP Cloud Native', 'K8s Produção'],
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
          appendAssistant('Canvas limpo! Pronto para um novo design.', ['VPC básica', 'Web App 3 camadas', 'Microserviços AWS', 'Infra Azure'])
          break
        }
        default: {
          appendAssistant(
            'Não entendi. Posso ajudar com:\n\n' +
            '• **Templates AWS**: "VPC básica", "web app 3 camadas", "serverless", "microserviços", "EKS"\n' +
            '• **Azure**: "infra azure"\n' +
            '• **GCP**: "GCP cloud native"\n' +
            '• **K8s**: "K8s produção"\n' +
            '• **Componentes**: "adicionar EC2", "colocar RDS", "criar Lambda"\n' +
            '• **Ações**: "organizar layout", "limpar canvas"\n' +
            '• **Exportar**: código Terraform no painel abaixo',
            ['VPC básica', 'Web App 3 camadas', 'Microserviços AWS', 'Infra Azure', 'GCP Cloud Native', 'Organizar layout'],
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
    // Template suggestions map
    const templateMap: Record<string, { key: string; msg: string; suggestions: string[] }> = {
      'VPC básica': { key: 'vpc-basico', msg: 'Pronto! VPC básica criada com VPC, Subnets, Internet Gateway e Route Table.', suggestions: ['Organizar layout', 'Adicionar EC2'] },
      'Web App 3 camadas': { key: 'web-app-3-tier', msg: 'Arquitetura 3 camadas criada! ALB → EC2 → RDS com Security Groups e S3.', suggestions: ['Organizar layout', 'Exportar código'] },
      'API Serverless': { key: 'serverless-api', msg: 'API Serverless criada! Lambda → DynamoDB + SQS + SNS.', suggestions: ['Organizar layout', 'Exportar código'] },
      'Microserviços AWS': { key: 'microservices-aws', msg: 'Microserviços AWS criados! ECS + ALB + RDS + ElastiCache + SQS + ECR.', suggestions: ['Organizar layout', 'Exportar código', 'Adicionar mais'] },
      'Kubernetes AWS (EKS)': { key: 'k8s-eks', msg: 'Cluster EKS criado! VPC + ECR + ALB + RDS + S3 + CloudWatch.', suggestions: ['Organizar layout', 'Exportar código'] },
      'Infra Azure': { key: 'azure-infra', msg: 'Infraestrutura Azure criada! VNet + App Gateway + VM + SQL + Storage + Functions.', suggestions: ['Organizar layout', 'Exportar código'] },
      'GCP Cloud Native': { key: 'gcp-native', msg: 'Arquitetura GCP criada! VPC + GKE + Cloud SQL + Cloud Storage + Cloud Run.', suggestions: ['Organizar layout', 'Exportar código'] },
      'K8s Produção': { key: 'k8s-production', msg: 'Kubernetes Produção criado! Deployments + Services + Ingress + ConfigMaps + Secrets + PVC + HPA.', suggestions: ['Organizar layout', 'Consolidar'] },
    }

    // Check if it's a template suggestion
    const templateMatch = templateMap[suggestion]
    if (templateMatch) {
      setInput('')
      setIsTyping(true)
      await new Promise(r => setTimeout(r, 300))
      await loadTemplate(templateMatch.key)
      appendAssistant(templateMatch.msg, templateMatch.suggestions)
      setIsTyping(false)
    } else if (suggestion === 'Organizar layout') {
      autoLayout()
      appendAssistant('Layout organizado! ✅')
    } else if (suggestion === 'Exportar código') {
      appendAssistant('Abra o painel de código abaixo (ícone </>) para ver o Terraform gerado.')
    } else if (suggestion === 'Salvar design') {
      appendAssistant('Use ⌘S ou o botão de salvar na toolbar para salvar.')
    } else if (suggestion === 'Adicionar mais') {
      appendAssistant('O que mais deseja adicionar?', ['EC2', 'RDS', 'Lambda', 'S3', 'ALB'])
    } else if (suggestion === 'Consolidar') {
      await autoLayout()
      appendAssistant('Layout consolidado! ✅')
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
