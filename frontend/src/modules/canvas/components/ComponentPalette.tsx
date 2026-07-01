import { useState, useMemo, useRef, type DragEvent } from 'react'
import {
  Search,
  Database,
  Shield,
  HardDrive,
  Server,
  Cloud,
  Network,
  Router,
  FunctionSquare,
  Component,
  Package,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/components/ui/hover-card'
import { cn } from '@/lib/utils'
import type { ComponentDefinition, ProviderType, ComponentCategory } from '@/types/canvas.types'
import type { PropertyField } from './properties/PropertySchema'
import { allComponents } from './properties/providerDefinitions'
import { ServiceIcon, getProviderLogo } from '../nodes/providerIcons'
import { getSchema } from './properties'

const providerConfig: Record<ProviderType, { color: string; bg: string; hoverBg: string; borderHover: string; iconBg: string; iconGroupHover: string }> = {
  aws: {
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    hoverBg: 'hover:bg-orange-50/80',
    borderHover: 'hover:border-orange-200',
    iconBg: 'bg-orange-100',
    iconGroupHover: 'group-hover:bg-orange-200',
  },
  azure: {
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    hoverBg: 'hover:bg-blue-50/80',
    borderHover: 'hover:border-blue-200',
    iconBg: 'bg-blue-100',
    iconGroupHover: 'group-hover:bg-blue-200',
  },
  gcp: {
    color: 'text-green-700',
    bg: 'bg-green-50',
    hoverBg: 'hover:bg-green-50/80',
    borderHover: 'hover:border-green-200',
    iconBg: 'bg-green-100',
    iconGroupHover: 'group-hover:bg-green-200',
  },
  k8s: {
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    hoverBg: 'hover:bg-indigo-50/80',
    borderHover: 'hover:border-indigo-200',
    iconBg: 'bg-indigo-100',
    iconGroupHover: 'group-hover:bg-indigo-200',
  },
  vercel: {
    color: 'text-neutral-700',
    bg: 'bg-neutral-50',
    hoverBg: 'hover:bg-neutral-50/80',
    borderHover: 'hover:border-neutral-200',
    iconBg: 'bg-neutral-100',
    iconGroupHover: 'group-hover:bg-neutral-200',
  },
  supabase: {
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    hoverBg: 'hover:bg-emerald-50/80',
    borderHover: 'hover:border-emerald-200',
    iconBg: 'bg-emerald-100',
    iconGroupHover: 'group-hover:bg-emerald-200',
  },
  render: {
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    hoverBg: 'hover:bg-teal-50/80',
    borderHover: 'hover:border-teal-200',
    iconBg: 'bg-teal-100',
    iconGroupHover: 'group-hover:bg-teal-200',
  },
}

const categoryIcons: Record<ComponentCategory, typeof Server> = {
  compute: Server,
  network: Network,
  storage: HardDrive,
  database: Database,
  security: Shield,
  serverless: FunctionSquare,
  monitoring: Cloud,
  integration: Router,
}

const categoryOrder: ComponentCategory[] = [
  'network', 'compute', 'database', 'storage', 'security', 'serverless', 'integration', 'monitoring',
]

const categoryLabels: Record<ComponentCategory, string> = {
  network: 'Rede',
  compute: 'Computação',
  database: 'Banco de Dados',
  storage: 'Armazenamento',
  security: 'Segurança',
  serverless: 'Serverless',
  integration: 'Integração',
  monitoring: 'Monitoramento',
}

const providerMeta: Record<ProviderType, { label: string; color: string; bg: string }> = {
  aws: { label: 'AWS', color: '#FF6600', bg: '#FFF0E0' },
  azure: { label: 'Azure', color: '#0078D4', bg: '#E0F0FF' },
  gcp: { label: 'GCP', color: '#4285F4', bg: '#E0F0FF' },
  k8s: { label: 'K8s', color: '#326CE5', bg: '#EEE0FF' },
  vercel: { label: 'Vercel', color: '#000000', bg: '#F0F0F0' },
  supabase: { label: 'Supabase', color: '#3ECF8E', bg: '#E0FFF0' },
  render: { label: 'Render', color: '#46E3B7', bg: '#E0FFF8' },
}

interface ComponentPaletteProps {
  variant?: 'default' | 'sidebar'
}

function ProviderIcon({ provider }: { provider: ProviderType }) {
  const svg = getProviderLogo(provider)
  if (!svg) return <Package className="w-3.5 h-3.5" />
  return <span dangerouslySetInnerHTML={{ __html: svg }} />
}

export function ComponentPalette({ variant = 'default' }: ComponentPaletteProps) {
  const [search, setSearch] = useState('')
  const [activeProvider, setActiveProvider] = useState<ProviderType | 'all'>('all')
  const [activeCategory, setActiveCategory] = useState<ComponentCategory | 'all'>('all')
  const [dragItem, setDragItem] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    return allComponents.filter((c) => {
      const matchSearch =
        !search ||
        c.displayName.toLowerCase().includes(search.toLowerCase()) ||
        c.resourceType.toLowerCase().includes(search.toLowerCase()) ||
        c.provider.includes(search.toLowerCase())
      const matchProvider = activeProvider === 'all' || c.provider === activeProvider
      const matchCategory = activeCategory === 'all' || c.category === activeCategory
      return matchSearch && matchProvider && matchCategory
    })
  }, [search, activeProvider, activeCategory])

  const grouped = useMemo(() => {
    const map = {} as Record<ComponentCategory, ComponentDefinition[]>
    for (const cat of categoryOrder) map[cat] = []
    for (const c of filtered) {
      if (!map[c.category]) map[c.category] = []
      map[c.category].push(c)
    }
    return Object.entries(map).filter(([, items]) => items.length > 0)
  }, [filtered])

  const providerCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allComponents.length }
    for (const p of ['aws', 'azure', 'gcp', 'k8s', 'vercel', 'supabase', 'render']) {
      counts[p] = allComponents.filter(c => c.provider === p).length
    }
    return counts
  }, [])

  const onDragStart = (event: DragEvent, component: ComponentDefinition) => {
    setDragItem(component.id)
    event.dataTransfer.setData('application/reactflow', JSON.stringify(component))
    event.dataTransfer.effectAllowed = 'move'

    // Create a custom drag ghost element with the component icon + name
    const ghost = document.createElement('div')
    ghost.className = 'fixed top-0 left-0 w-48 px-3 py-2 rounded-xl bg-white border border-brand-navy/20 shadow-xl flex items-center gap-2.5 text-sm font-medium text-brand-navy pointer-events-none z-[9999]'
    ghost.style.transform = 'translate(-9999px, -9999px)'
    ghost.innerHTML = `
      <div class="w-7 h-7 rounded-lg flex items-center justify-center bg-brand-navy/10 shrink-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0a1128" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      </div>
      <span class="truncate">${component.displayName}</span>
    `
    document.body.appendChild(ghost)
    event.dataTransfer.setDragImage(ghost, 0, 0)
    // Clean up ghost after drag starts (it's cloned by the browser)
    requestAnimationFrame(() => document.body.removeChild(ghost))
  }

  const onDragEnd = () => setDragItem(null)

  const providerTabs: Array<{ id: ProviderType | 'all'; label: string }> = [
    { id: 'all', label: 'Todos' },
    { id: 'aws', label: 'AWS' },
    { id: 'azure', label: 'Azure' },
    { id: 'gcp', label: 'GCP' },
    { id: 'k8s', label: 'K8s' },
    { id: 'vercel', label: 'Vercel' },
    { id: 'supabase', label: 'Supabase' },
    { id: 'render', label: 'Render' },
  ]

  return (
    <div className={cn("flex flex-col h-full overflow-hidden", variant === 'sidebar' ? 'bg-white' : 'bg-white rounded-3xl card-shadow border border-slate-100')}>
      <div className="p-4 border-b border-slate-100 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-lime shrink-0" />
          <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Componentes</span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            ref={searchInputRef}
            placeholder="Buscar componentes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 rounded-lg focus:border-brand-navy focus:ring-1 focus:ring-brand-navy/20 placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); searchInputRef.current?.focus() }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <span className="text-xs font-bold">✕</span>
            </button>
          )}
        </div>
        <div className="flex gap-1 flex-wrap">
          {providerTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveProvider(tab.id)}
              className={cn(
                'px-3 py-1 text-xs rounded-full font-medium transition-all flex items-center gap-1',
                activeProvider === tab.id
                  ? 'bg-brand-navy text-white shadow-sm'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
              )}
            >
              {tab.id !== 'all' && (
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        tab.id === 'aws' ? '#FF9900' :
                        tab.id === 'azure' ? '#0078D4' :
                        tab.id === 'gcp' ? '#4285F4' :
                        tab.id === 'k8s' ? '#326CE5' :
                        tab.id === 'vercel' ? '#000000' :
                        tab.id === 'supabase' ? '#3ECF8E' :
                        tab.id === 'render' ? '#46E3B7' : undefined,
                    }}
                />
              )}
              {tab.label}
              <span className={cn(
                'ml-1 text-[10px]',
                activeProvider === tab.id ? 'text-white/60' : 'text-slate-400'
              )}>
                {providerCounts[tab.id]}
              </span>
            </button>
          ))}
        </div>

        {/* Category filter chips */}
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              'px-2 py-0.5 text-[10px] rounded-full font-medium transition-all',
              activeCategory === 'all'
                ? 'bg-brand-navy/10 text-brand-navy font-bold'
                : 'text-slate-400 hover:text-slate-600'
            )}
          >
            Todas
          </button>
          {categoryOrder.map((cat) => {
            const count = filtered.filter(c => c.category === cat).length
            if (count === 0 && activeCategory !== cat) return null
            const Icon = categoryIcons[cat]
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? 'all' : cat)}
                className={cn(
                  'px-2 py-0.5 text-[10px] rounded-full font-medium transition-all flex items-center gap-1',
                  activeCategory === cat
                    ? 'bg-brand-navy/10 text-brand-navy font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                )}
              >
                {Icon && <Icon className="w-2.5 h-2.5" />}
                {categoryLabels[cat]}
              </button>
            )
          })}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {grouped.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <Component className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">Nenhum componente encontrado</p>
              <p className="text-xs text-slate-400 mt-1">Tente ajustar sua busca ou filtro</p>
            </div>
          )}
          {grouped.map(([category, items]) => (
            <div key={category}>
              <div className="flex items-center gap-2 px-1 mb-2">
                {categoryIcons[category as ComponentCategory] &&
                  (() => {
                    const Icon = categoryIcons[category as ComponentCategory]
                    return <Icon className="w-3.5 h-3.5 text-slate-400" />
                  })()}
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {categoryLabels[category as ComponentCategory]}
                </span>
                <span className="text-[10px] text-slate-300 font-mono ml-auto">{items.length}</span>
              </div>
              <div className="space-y-0.5">
                {items.map((component) => {
                  const pconf = providerConfig[component.provider]
                  const schema = getSchema(component.resourceType)
                  return (
                    <HoverCard key={component.id} openDelay={300} closeDelay={100}>
                      <HoverCardTrigger asChild>
                        <div
                          draggable
                          onDragStart={(e) => onDragStart(e, component)}
                          onDragEnd={onDragEnd}
                          className={cn(
                            'flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-grab select-none transition-all border',
                            dragItem === component.id ? 'opacity-50 scale-95 border-brand-navy shadow-md' : 'border-transparent',
                            pconf.hoverBg,
                            pconf.borderHover,
                          )}
                        >
                          <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110',
                            pconf.iconBg,
                            dragItem === component.id ? 'scale-110' : ''
                          )}>
                            <ServiceIcon componentId={component.id} size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-800 truncate leading-tight">
                              {component.displayName}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <ProviderIcon provider={component.provider} />
                              <span className="text-[10px] font-semibold" style={{ color: providerMeta[component.provider].color }}>
                                {providerMeta[component.provider].label}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">· {component.resourceType}</span>
                            </div>
                          </div>
                          <div
                            className="h-5 px-1.5 rounded text-[8px] font-bold uppercase tracking-wider flex items-center shrink-0"
                            style={{ backgroundColor: providerMeta[component.provider].bg, color: providerMeta[component.provider].color }}
                          >
                            {component.provider}
                          </div>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent
                        side="right"
                        align="start"
                        sideOffset={8}
                        className="w-64 p-3"
                      >
                        <div className="flex items-start gap-3 mb-2">
                          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', pconf.iconBg)}>
                            <ServiceIcon componentId={component.id} size={24} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-brand-navy truncate">{component.displayName}</p>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">{component.resourceType}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {schema.slice(0, 4).map((prop: PropertyField) => (
                            <div key={prop.key} className="flex justify-between text-[10px]">
                              <span className="text-slate-500">{prop.label}</span>
                              <span className="font-mono text-slate-700">{prop.type}</span>
                            </div>
                          ))}
                          {schema.length > 4 && (
                            <p className="text-[9px] text-slate-400 pt-1 border-t border-slate-100 mt-1">
                              +{schema.length - 4} propriedades
                            </p>
                          )}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
