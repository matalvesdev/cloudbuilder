import { useState, useCallback, useRef, useMemo } from 'react'
import {
  Cloud, Upload, FileText, FolderOpen, Scan, CheckCircle2, X,
  Loader2, AlertTriangle, Server, Globe, Database, HardDrive,
  Shield, Network, FileCode, LayoutDashboard,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useCanvasStore } from '@/store/canvasStore'
import { useCredentialStore } from '@/store/credentialStore'
import type { ProviderType, ImportedResource, ResourceGroup } from '@/types/import.types'

interface ImportInfraDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ScannedResource {
  id: string
  resourceType: string
  name: string
  provider: ProviderType
  properties: Record<string, string>
}

interface ScannedGroup {
  name: string
  provider: ProviderType
  icon: string
  resources: ScannedResource[]
}

function getGroupIcon(name: string) {
  const iconName = {
    Compute: Server,
    Networking: Globe,
    Storage: HardDrive,
    Database: Database,
    Security: Shield,
  }[name]
  return iconName || Server
}

function getProviderColor(provider: string): string {
  const colors: Record<string, string> = {
    aws: '#FF9900',
    azure: '#0078D4',
    gcp: '#4285F4',
    k8s: '#326CE5',
  }
  return colors[provider] || '#6b7280'
}

function getProviderLabel(provider: string): string {
  const labels: Record<string, string> = {
    aws: 'AWS',
    azure: 'Azure',
    gcp: 'GCP',
    k8s: 'Kubernetes',
  }
  return labels[provider] || provider
}

function getServiceDisplayType(resourceType: string): string {
  const map: Record<string, string> = {
    aws_instance: 'EC2',
    aws_autoscaling_group: 'Auto Scaling',
    aws_launch_template: 'Launch Template',
    aws_vpc: 'VPC',
    aws_subnet: 'Subnet',
    aws_internet_gateway: 'Internet Gateway',
    aws_route_table: 'Route Table',
    aws_security_group: 'Security Group',
    aws_lb: 'ALB',
    aws_s3_bucket: 'S3',
    aws_ebs_volume: 'EBS',
    aws_db_instance: 'RDS',
    aws_elasticache_cluster: 'ElastiCache',
    azurerm_virtual_machine: 'VM',
    azurerm_kubernetes_cluster: 'AKS',
    azurerm_virtual_network: 'VNet',
    azurerm_subnet: 'Subnet',
    azurerm_network_security_group: 'NSG',
    azurerm_application_gateway: 'App Gateway',
    azurerm_storage_account: 'Storage Account',
    azurerm_mssql_database: 'SQL Database',
    azurerm_mssql_server: 'SQL Server',
    google_compute_instance: 'GCE',
    google_container_cluster: 'GKE',
    google_compute_network: 'VPC',
    google_compute_subnetwork: 'Subnet',
    google_compute_firewall: 'Firewall',
    google_compute_forwarding_rule: 'LB',
    google_storage_bucket: 'GCS',
    google_sql_database_instance: 'Cloud SQL',
    google_redis_instance: 'Memorystore',
  }
  return map[resourceType] || resourceType
}

function inferConnections(resources: ImportedResource[]): { source: string; target: string; type: string }[] {
  const conns: { source: string; target: string; type: string }[] = []
  for (const res of resources) {
    const props = res.properties
    if (props.vpcId || props.network || props.vpc_id || props.vpc_self_link) {
      const targetId = props.vpcId || props.network || props.vpc_id || props.vpc_self_link || ''
      const target = resources.find(r =>
        r.id === targetId ||
        r.name === targetId ||
        r.resourceType.includes('vpc') && (
          r.properties.cidrBlock === props.cidrBlock ||
          r.properties.addressSpace === props.addressSpace
        )
      )
      if (target && target.id !== res.id) {
        conns.push({ source: target.id, target: res.id, type: 'network' })
      }
    }
    if (props.subnetId || props.subnetwork) {
      const subnetId = props.subnetId || props.subnetwork || ''
      const target = resources.find(r => r.id === subnetId || r.name === subnetId)
      if (target) {
        conns.push({ source: target.id, target: res.id, type: 'network' })
      }
    }
    if (props.vpcId || props.vpc_id) {
      const vpcId = props.vpcId || props.vpc_id || ''
      const target = resources.find(r => r.id === vpcId || r.name === vpcId)
      if (target) {
        conns.push({ source: target.id, target: res.id, type: 'network' })
      }
    }
  }
  return conns
}

export function ImportInfraDialog({ open, onOpenChange }: ImportInfraDialogProps) {
  const [activeTab, setActiveTab] = useState<string>('provider-scan')
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>('aws')
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanResult, setScanResult] = useState<ScannedGroup[] | null>(null)
  const [selectedResourceIds, setSelectedResourceIds] = useState<Set<string>>(new Set())
  const [stateFileContent, setStateFileContent] = useState('')
  const [stateFileName, setStateFileName] = useState('')
  const [parsingState, setParsingState] = useState(false)
  const [stateParseResult, setStateParseResult] = useState<ImportedResource[] | null>(null)
  const [stateFileWarnings, setStateFileWarnings] = useState<string[]>([])
  const [tfFiles, setTfFiles] = useState<{ name: string; path: string; content: string; resources: ScannedResource[] }[]>([])
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const stateFileInputRef = useRef<HTMLInputElement>(null)
  const tfDirInputRef = useRef<HTMLInputElement>(null)

  const { credentials } = useCredentialStore()
  const connectedCredentials = credentials.filter(c => c.status === 'valid')

  const addNode = useCanvasStore(s => s.addNode)
  const addEdgeWithType = useCanvasStore(s => s.addEdgeWithType)
  const autoLayout = useCanvasStore(s => s.autoLayout)
  const nodes = useCanvasStore(s => s.nodes)

  const reset = useCallback(() => {
    setScanResult(null)
    setSelectedResourceIds(new Set())
    setStateFileContent('')
    setStateFileName('')
    setStateParseResult(null)
    setStateFileWarnings([])
    setTfFiles([])
    setScanning(false)
    setParsingState(false)
    setImporting(false)
    setError('')
    setScanProgress(0)
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onOpenChange(false)
  }, [onOpenChange, reset])

  const handleScan = useCallback(async () => {
    setScanning(true)
    setError('')
    setScanProgress(0)
    setScanResult(null)
    setSelectedResourceIds(new Set())

    const totalGroups = 0
    for (let i = 0; i < totalGroups; i++) {
      await new Promise(r => setTimeout(r, 400 + Math.random() * 600))
      setScanProgress(Math.round(((i + 1) / totalGroups) * 100))
    }

    await new Promise(r => setTimeout(r, 500))
    setScanResult([])
    setSelectedResourceIds(new Set())
    setScanning(false)
  }, [selectedProvider])

  const handleStateFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setStateFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setStateFileContent(text)
      setStateParseResult(null)
      setStateFileWarnings([])
      setError('')
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  const handleParseState = useCallback(async () => {
    if (!stateFileContent.trim()) {
      setError('Selecione um arquivo .tfstate primeiro.')
      return
    }
    setParsingState(true)
    setError('')
    try {
      await new Promise(r => setTimeout(r, 1500))
      const parsed: ImportedResource[] = []
      setStateParseResult(parsed)
      const allIds = new Set(parsed.map(r => r.id))
      setSelectedResourceIds(allIds)
      setStateFileWarnings([])
    } catch {
      setError('Erro ao processar o arquivo de estado.')
    } finally {
      setParsingState(false)
    }
  }, [stateFileContent])

  const handleTfDirSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setError('')

    const parsed: { name: string; path: string; content: string; resources: ScannedResource[] }[] = []
    for (const file of Array.from(files)) {
      const content = await file.text()
      const resources: ScannedResource[] = []
      if (content.includes('resource "')) {
        const provider = content.includes('aws_') ? 'aws' as ProviderType : content.includes('azurerm_') ? 'azure' as ProviderType : content.includes('google_') ? 'gcp' as ProviderType : 'aws' as ProviderType
        const matches = content.matchAll(/resource\s+"(\w+)"\s+"(\w+)"/g)
        for (const match of matches) {
          resources.push({
            id: `${match[1]}.${match[2]}`,
            resourceType: match[1],
            name: match[2],
            provider,
            properties: {},
          })
        }
      }
      parsed.push({ name: file.name, path: file.webkitRelativePath || file.name, content, resources })
    }
    setTfFiles(parsed)
    const allIds = new Set<string>()
    parsed.forEach(f => f.resources.forEach(r => allIds.add(r.id)))
    setSelectedResourceIds(allIds)
    e.target.value = ''
  }, [])

  const toggleResource = useCallback((id: string) => {
    setSelectedResourceIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleGroup = useCallback((groupResources: ScannedResource[], checked: boolean) => {
    setSelectedResourceIds(prev => {
      const next = new Set(prev)
      for (const res of groupResources) {
        if (checked) next.add(res.id)
        else next.delete(res.id)
      }
      return next
    })
  }, [])

  const getSelectedResources = useCallback((): ImportedResource[] => {
    if (activeTab === 'provider-scan' && scanResult) {
      const resources: ImportedResource[] = []
      for (const group of scanResult) {
        for (const res of group.resources) {
          if (selectedResourceIds.has(res.id)) {
            resources.push({
              id: res.id,
              provider: res.provider,
              resourceType: res.resourceType,
              name: res.name,
              properties: res.properties,
              groupName: group.name,
            })
          }
        }
      }
      return resources
    }
    if (activeTab === 'state-file' && stateParseResult) {
      return stateParseResult.filter(r => selectedResourceIds.has(r.id))
    }
    if (activeTab === 'terraform-dir') {
      const resources: ImportedResource[] = []
      for (const file of tfFiles) {
        for (const res of file.resources) {
          if (selectedResourceIds.has(res.id)) {
            const groupName = res.resourceType.includes('vpc') || res.resourceType.includes('subnet') || res.resourceType.includes('sg') || res.resourceType.includes('lb') || res.resourceType.includes('igw') || res.resourceType.includes('route')
              ? 'Networking'
              : res.resourceType.includes('instance') || res.resourceType.includes('cluster') || res.resourceType.includes('autoscaling')
              ? 'Compute'
              : res.resourceType.includes('bucket') || res.resourceType.includes('volume')
              ? 'Storage'
              : res.resourceType.includes('db_') || res.resourceType.includes('elasticache') || res.resourceType.includes('redis')
              ? 'Database'
              : 'Other'
            resources.push({
              id: res.id,
              provider: res.provider,
              resourceType: res.resourceType,
              name: res.name,
              properties: res.properties,
              groupName,
            })
          }
        }
      }
      return resources
    }
    return []
  }, [activeTab, scanResult, stateParseResult, tfFiles, selectedResourceIds])

  const groupedResources = useMemo(() => {
    const selected = getSelectedResources()
    const groups = new Map<string, { provider: ProviderType; resources: ImportedResource[] }>()
    for (const res of selected) {
      const g = groups.get(res.groupName) || { provider: res.provider, resources: [] }
      g.resources.push(res)
      groups.set(res.groupName, g)
    }
    return Array.from(groups.entries()).map(([name, data]) => ({
      name,
      provider: data.provider,
      count: data.resources.length,
      resources: data.resources,
    }))
  }, [getSelectedResources])

  const handleImportToCanvas = useCallback(async () => {
    const selected = getSelectedResources()
    if (selected.length === 0) return

    setImporting(true)

    const cols = Math.max(1, Math.ceil(Math.sqrt(selected.length)))
    const nameToId = new Map<string, string>()

    for (let i = 0; i < selected.length; i++) {
      const res = selected[i]
      const displayName = `${getServiceDisplayType(res.resourceType)}: ${res.name}`

      addNode(
        {
          id: res.resourceType,
          displayName,
          provider: res.provider,
          resourceType: res.resourceType,
        },
        { x: 80 + (i % cols) * 300, y: 80 + Math.floor(i / cols) * 180 }
      )

      const store = useCanvasStore.getState()
      const newNode = store.nodes[store.nodes.length - 1]
      if (newNode) {
        nameToId.set(res.id, newNode.id)
      }
    }

    const connections = inferConnections(selected)
    for (const conn of connections) {
      const sourceId = nameToId.get(conn.source)
      const targetId = nameToId.get(conn.target)
      if (sourceId && targetId) {
        addEdgeWithType(sourceId, targetId, 'network')
      }
    }

    await new Promise(r => setTimeout(r, 50))
    await autoLayout()

    setImporting(false)
    handleClose()
  }, [getSelectedResources, addNode, addEdgeWithType, autoLayout, handleClose])

  const selectedCount = selectedResourceIds.size

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={handleClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-ice-blue/50 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-brand-navy" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brand-navy font-display">Importar Infraestrutura</h2>
              <p className="text-xs text-slate-400">Importe recursos existentes da nuvem para gerar um diagrama no Canvas</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="px-6 pt-4">
            <TabsList className="w-full bg-slate-100 h-auto p-1">
              <TabsTrigger value="provider-scan" className="flex-1 text-xs py-2 gap-1.5 data-[state=active]:shadow-sm">
                <Scan className="w-3.5 h-3.5" />
                Escanear Provedor
              </TabsTrigger>
              <TabsTrigger value="state-file" className="flex-1 text-xs py-2 gap-1.5 data-[state=active]:shadow-sm">
                <FileText className="w-3.5 h-3.5" />
                Upload .tfstate
              </TabsTrigger>
              <TabsTrigger value="terraform-dir" className="flex-1 text-xs py-2 gap-1.5 data-[state=active]:shadow-sm">
                <FolderOpen className="w-3.5 h-3.5" />
                Diretório IaC
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {error && (
              <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <TabsContent value="provider-scan" className="mt-0 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Credencial</label>
                  <select
                    value={selectedProvider}
                    onChange={e => { setSelectedProvider(e.target.value as ProviderType); setScanResult(null) }}
                    className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-lime/60 focus:border-brand-navy"
                  >
                    {(['aws', 'azure', 'gcp'] as ProviderType[]).map(p => (
                      <option key={p} value={p}>{getProviderLabel(p)}</option>
                    ))}
                  </select>
                </div>
                <div className="pt-5">
                  <button
                    onClick={handleScan}
                    disabled={scanning}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-5 h-10 rounded-xl text-xs font-bold transition-all',
                      scanning
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-brand-navy text-white hover:bg-brand-navy/90 shadow-sm'
                    )}
                  >
                    {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scan className="w-3.5 h-3.5" />}
                    {scanning ? 'Escaneando...' : 'Escanear'}
                  </button>
                </div>
              </div>

              {connectedCredentials.length === 0 && !scanning && !scanResult && (
                <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Nenhuma credencial conectada. Configure credenciais em Configurações &rarr; Credenciais.
                </div>
              )}

              {scanning && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-brand-navy" />
                    <div>
                      <p className="text-sm font-semibold text-brand-navy">Escaneando infraestrutura...</p>
                      <p className="text-xs text-slate-400">Descoberta de recursos via API do provedor</p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-brand-navy rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">{scanProgress}% concluído</p>
                </div>
              )}

              {scanResult && !scanning && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      <span className="font-semibold text-brand-navy">{selectedCount}</span> recursos selecionados
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const allIds = new Set(scanResult.flatMap(g => g.resources.map(r => r.id)))
                          setSelectedResourceIds(allIds)
                        }}
                        className="text-[10px] font-semibold text-brand-navy underline underline-offset-2 hover:no-underline"
                      >
                        Selecionar todos
                      </button>
                      <button
                        onClick={() => setSelectedResourceIds(new Set())}
                        className="text-[10px] font-semibold text-slate-400 underline underline-offset-2 hover:no-underline"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                  {scanResult.map((group) => {
                    const GroupIcon = getGroupIcon(group.name)
                    const groupChecked = group.resources.every(r => selectedResourceIds.has(r.id))
                    const groupPartial = group.resources.some(r => selectedResourceIds.has(r.id)) && !groupChecked
                    return (
                      <div key={group.name} className="space-y-1">
                        <div className="flex items-center gap-2 px-1">
                          <button
                            onClick={() => toggleGroup(group.resources, !groupChecked)}
                            className={cn(
                              'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                              groupChecked
                                ? 'border-brand-navy bg-brand-navy'
                                : groupPartial
                                ? 'border-brand-navy/50 bg-brand-navy/20'
                                : 'border-slate-300'
                            )}
                          >
                            {groupChecked && <CheckCircle2 className="w-3 h-3 text-brand-lime" />}
                            {groupPartial && <div className="w-2 h-0.5 bg-brand-navy rounded" />}
                          </button>
                          <GroupIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{group.name}</span>
                          <span className="text-[10px] text-slate-300">·</span>
                          <span className="text-[10px] text-slate-400">{group.resources.length} recursos</span>
                        </div>
                        <div className="space-y-0.5 ml-6">
                          {group.resources.map((res) => {
                            const isSelected = selectedResourceIds.has(res.id)
                            return (
                              <div
                                key={res.id}
                                onClick={() => toggleResource(res.id)}
                                className={cn(
                                  'flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all',
                                  isSelected
                                    ? 'border-brand-navy/20 bg-brand-navy/[0.03]'
                                    : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                                )}
                              >
                                <div className={cn(
                                  'w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                                  isSelected
                                    ? 'border-brand-navy bg-brand-navy'
                                    : 'border-slate-300'
                                )}>
                                  {isSelected && <CheckCircle2 className="w-2.5 h-2.5 text-brand-lime" />}
                                </div>
                                <span
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{ backgroundColor: getProviderColor(res.provider) }}
                                />
                                <span className="text-xs font-medium text-brand-navy truncate flex-1">{res.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono shrink-0">{getServiceDisplayType(res.resourceType)}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="state-file" className="mt-0 space-y-4">
              {!stateParseResult && (
                <>
                  <div
                    onClick={() => stateFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-brand-navy/40 hover:bg-slate-50/50 transition-all"
                  >
                    <input ref={stateFileInputRef} type="file" accept=".tfstate,.json" className="hidden" onChange={handleStateFileSelect} />
                    <div className="w-12 h-12 rounded-2xl bg-ice-blue/50 flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-6 h-6 text-brand-navy/60" />
                    </div>
                    <p className="text-sm font-medium text-brand-navy mb-1">
                      {stateFileName || 'Clique para selecionar o arquivo .tfstate'}
                    </p>
                    <p className="text-xs text-slate-400">
                      Faça upload do terraform.tfstate do seu ambiente
                    </p>
                  </div>
                  <button
                    onClick={handleParseState}
                    disabled={parsingState || !stateFileContent.trim()}
                    className={cn(
                      'w-full inline-flex items-center justify-center gap-1.5 px-5 h-10 rounded-xl text-xs font-bold transition-all',
                      parsingState || !stateFileContent.trim()
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-brand-navy text-white hover:bg-brand-navy/90 shadow-sm'
                    )}
                  >
                    {parsingState ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCode className="w-3.5 h-3.5" />}
                    {parsingState ? 'Analisando estado...' : 'Analisar Estado'}
                  </button>
                </>
              )}

              {stateParseResult && !parsingState && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      <span><strong className="text-brand-navy">{stateParseResult.length}</strong> recursos encontrados no estado</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setStateParseResult(null); setStateFileContent(''); setStateFileName('') }} className="text-[10px] font-semibold text-slate-400 underline underline-offset-2 hover:no-underline">
                        Novo upload
                      </button>
                    </div>
                  </div>

                  {stateFileWarnings.length > 0 && (
                    <div className="space-y-1">
                      {stateFileWarnings.map((w, i) => (
                        <div key={i} className="flex items-start gap-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {groupedResources.map((g) => {
                    const GroupIcon = getGroupIcon(g.name)
                    return (
                      <div key={g.name} className="space-y-1">
                        <div className="flex items-center gap-2 px-1">
                          <GroupIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{g.name}</span>
                          <span className="text-[10px] text-slate-400">{g.count} recursos</span>
                        </div>
                        <div className="space-y-0.5 ml-6">
                          {g.resources.map((res) => (
                            <div key={res.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-transparent">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getProviderColor(res.provider) }} />
                              <span className="text-xs font-medium text-brand-navy truncate flex-1">{res.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">{getServiceDisplayType(res.resourceType)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="terraform-dir" className="mt-0 space-y-4">
              {tfFiles.length === 0 && (
                <div
                  onClick={() => tfDirInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-brand-navy/40 hover:bg-slate-50/50 transition-all"
                >
                  {/* @ts-ignore - webkitdirectory is a non-standard attribute for directory selection */}
                  <input ref={tfDirInputRef} type="file" webkitdirectory="" directory="" multiple className="hidden" onChange={handleTfDirSelect} />
                  <div className="w-12 h-12 rounded-2xl bg-ice-blue/50 flex items-center justify-center mx-auto mb-3">
                    <FolderOpen className="w-6 h-6 text-brand-navy/60" />
                  </div>
                  <p className="text-sm font-medium text-brand-navy mb-1">
                    Selecione uma pasta com arquivos Terraform
                  </p>
                  <p className="text-xs text-slate-400">
                    Selecione o diretório raiz do seu projeto IaC (.tf, .tfvars)
                  </p>
                </div>
              )}

              {tfFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      <span><strong className="text-brand-navy">{tfFiles.length}</strong> arquivos encontrados</span>
                    </div>
                    <button onClick={() => setTfFiles([])} className="text-[10px] font-semibold text-slate-400 underline underline-offset-2 hover:no-underline">
                      Nova seleção
                    </button>
                  </div>

                  {tfFiles.map((file, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-medium text-brand-navy">{file.name}</span>
                        <span className="text-[10px] text-slate-400">{file.resources.length} recursos</span>
                      </div>
                      {file.resources.length > 0 && (
                        <div className="space-y-0.5 ml-5">
                          {file.resources.map((res) => (
                            <div
                              key={res.id}
                              onClick={() => toggleResource(res.id)}
                              className={cn(
                                'flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all',
                                selectedResourceIds.has(res.id)
                                  ? 'border-brand-navy/20 bg-brand-navy/[0.03]'
                                  : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                              )}
                            >
                              <div className={cn(
                                'w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                                selectedResourceIds.has(res.id)
                                  ? 'border-brand-navy bg-brand-navy'
                                  : 'border-slate-300'
                              )}>
                                {selectedResourceIds.has(res.id) && <CheckCircle2 className="w-2.5 h-2.5 text-brand-lime" />}
                              </div>
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getProviderColor(res.provider) }} />
                              <span className="text-xs font-medium text-brand-navy truncate flex-1">{res.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">{res.resourceType}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <LayoutDashboard className="w-3.5 h-3.5" />
            {selectedCount > 0
              ? `${selectedCount} recursos em ${groupedResources.length} grupos serão importados`
              : 'Selecione recursos para importar'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleImportToCanvas}
              disabled={importing || selectedCount === 0}
              className={cn(
                'px-5 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2',
                importing || selectedCount === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-brand-navy text-brand-lime hover:bg-brand-navy/90 shadow-sm'
              )}
            >
              {importing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</>
              ) : (
                <><LayoutDashboard className="w-4 h-4" /> Gerar Canvas</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
