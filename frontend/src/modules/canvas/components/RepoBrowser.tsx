import { useState, useCallback, useEffect } from 'react'
import {
  Github, Folder, FileText, ChevronRight, ChevronDown,
  Loader2, X, ArrowLeft, FileCode, Database, Search, Code2,
} from 'lucide-react'
import { importTerraform, importState } from '@/api/import'
import { useCanvasStore } from '@/store/canvasStore'
import { cn } from '@/lib/utils'
import { allComponents } from './properties/providerDefinitions'
import { CodeAnalysisReviewDialog } from './CodeAnalysisReviewDialog'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

interface Repo {
  id: number
  fullName: string
  name: string
  owner: string
  description: string
  defaultBranch: string
  language: string
  isPrivate: boolean
  updatedAt: string
  htmlUrl: string
}

interface FileItem {
  name: string
  path: string
  type: 'file' | 'dir'
  sha: string
  size: number
}

interface RepoBrowserProps {
  token: string
  onClose: () => void
}

export function RepoBrowser({ token, onClose }: RepoBrowserProps) {
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null)
  const [currentPath, setCurrentPath] = useState('')
  const [files, setFiles] = useState<FileItem[]>([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [importing, setImporting] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCodeAnalysis, setShowCodeAnalysis] = useState(false)
  const [analysisFiles, setAnalysisFiles] = useState<{ fileName: string; path: string; content: string }[]>([])
  const [analysisRepo, setAnalysisRepo] = useState('')

  const addNode = useCanvasStore((s) => s.addNode)
  const addEdgeWithType = useCanvasStore((s) => s.addEdgeWithType)
  const autoLayout = useCanvasStore((s) => s.autoLayout)

  useEffect(() => {
    loadRepos()
  }, [token])

  const loadRepos = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/github/repos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Falha ao carregar repositórios')
      const data = await response.json()
      setRepos(data.repos || [])
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar repositórios')
    } finally {
      setLoading(false)
    }
  }

  const loadFiles = async (repo: Repo, path: string) => {
    setFilesLoading(true)
    setError('')
    try {
      const response = await fetch(
        `${API_BASE}/github/repos/${repo.owner}/${repo.name}/contents?path=${encodeURIComponent(path)}&branch=${repo.defaultBranch}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      if (!response.ok) throw new Error('Falha ao carregar arquivos')
      const data = await response.json()
      setFiles(data.files || [])
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar arquivos')
    } finally {
      setFilesLoading(false)
    }
  }

  const handleSelectRepo = useCallback((repo: Repo) => {
    setSelectedRepo(repo)
    setCurrentPath('')
    loadFiles(repo, '')
  }, [token])

  const handleNavigateDir = useCallback((path: string) => {
    if (!selectedRepo) return
    setCurrentPath(path)
    loadFiles(selectedRepo, path)
  }, [token, selectedRepo])

  const handleGoBack = useCallback(() => {
    if (!selectedRepo) return
    const parentPath = currentPath.includes('/')
      ? currentPath.substring(0, currentPath.lastIndexOf('/'))
      : ''
    setCurrentPath(parentPath)
    loadFiles(selectedRepo, parentPath)
  }, [selectedRepo, currentPath])

  const handleImportFile = useCallback(async (file: FileItem) => {
    if (!selectedRepo || !token) return
    setImporting(file.path)

    try {
      // Fetch file content
      const response = await fetch(
        `${API_BASE}/github/repos/${selectedRepo.owner}/${selectedRepo.name}/file?path=${encodeURIComponent(file.path)}&branch=${selectedRepo.defaultBranch}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      const data = await response.json()

      if (!data.content) {
        throw new Error('Arquivo vazio')
      }

      // Determine import type by extension
      const isState = file.name.endsWith('.tfstate') || file.name.endsWith('.tfstate.json')
      const isHcl = file.name.endsWith('.tf') || file.name.endsWith('.hcl')

      let resources: any[] = []
      let connections: any[] = []

      if (isState) {
        const result = await importState(data.content)
        resources = result.resources
        connections = result.connections
      } else if (isHcl) {
        const result = await importTerraform(data.content)
        resources = result.resources
        connections = result.connections
      } else {
        throw new Error('Formato não suportado. Use .tf, .hcl, ou .tfstate')
      }

      // Add to canvas
      const nameToId = new Map<string, string>()
      const cols = Math.max(1, Math.ceil(Math.sqrt(resources.length)))

      for (let i = 0; i < resources.length; i++) {
        const res = resources[i]
        const resourceKey = `${res.resourceType}.${res.name}`

        addNode(
          {
            id: res.resourceType,
            displayName: res.displayType !== res.resourceType ? `${res.displayType}: ${res.name}` : res.name,
            provider: res.provider,
            resourceType: res.resourceType,
          },
          { x: 80 + (i % cols) * 300, y: 80 + Math.floor(i / cols) * 180 }
        )

        const store = useCanvasStore.getState()
        const newNode = store.nodes[store.nodes.length - 1]
        if (newNode) nameToId.set(resourceKey, newNode.id)
      }

      for (const conn of connections) {
        const sourceId = nameToId.get(conn.sourceResourceName)
        const targetId = nameToId.get(conn.targetResourceName)
        if (sourceId && targetId) {
          addEdgeWithType(sourceId, targetId, 'default')
        }
      }

      await new Promise(r => setTimeout(r, 50))
      await autoLayout()
    } catch (err: any) {
      setError(`Erro ao importar ${file.name}: ${err.message}`)
    } finally {
      setImporting(null)
    }
  }, [selectedRepo, token, addNode, addEdgeWithType, autoLayout])

  const handleImportAllTerraform = useCallback(async () => {
    if (!selectedRepo || !token) return

    const tfFiles = files.filter(f =>
      f.type === 'file' && (f.name.endsWith('.tf') || f.name.endsWith('.hcl') || f.name.endsWith('.tfstate'))
    )

    if (tfFiles.length === 0) {
      setError('Nenhum arquivo .tf ou .tfstate encontrado nesta pasta.')
      return
    }

    setImporting('all')

    try {
      for (const file of tfFiles) {
        const response = await fetch(
          `${API_BASE}/github/repos/${selectedRepo.owner}/${selectedRepo.name}/file?path=${encodeURIComponent(file.path)}&branch=${selectedRepo.defaultBranch}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        )
        const data = await response.json()
        if (!data.content) continue

        const isState = file.name.endsWith('.tfstate')
        const result = isState ? await importState(data.content) : await importTerraform(data.content)

        const nameToId = new Map<string, string>()
        const cols = Math.max(1, Math.ceil(Math.sqrt(result.resources.length)))

        for (let i = 0; i < result.resources.length; i++) {
          const res = result.resources[i]
          addNode(
            {
              id: res.resourceType,
              displayName: res.displayType !== res.resourceType ? `${res.displayType}: ${res.name}` : res.name,
              provider: res.provider,
              resourceType: res.resourceType,
            },
            { x: 80 + (i % cols) * 300, y: 80 + Math.floor(i / cols) * 180 }
          )
          const store = useCanvasStore.getState()
          const newNode = store.nodes[store.nodes.length - 1]
          if (newNode) nameToId.set(`${res.resourceType}.${res.name}`, newNode.id)
        }

        for (const conn of result.connections) {
          const sourceId = nameToId.get(conn.sourceResourceName)
          const targetId = nameToId.get(conn.targetResourceName)
          if (sourceId && targetId) addEdgeWithType(sourceId, targetId, 'default')
        }
      }

      await new Promise(r => setTimeout(r, 50))
      await autoLayout()
    } catch (err: any) {
      setError(`Erro ao importar: ${err.message}`)
    } finally {
      setImporting(null)
    }
  }, [selectedRepo, token, files, addNode, addEdgeWithType, autoLayout])

  const filteredRepos = repos.filter(r =>
    !searchQuery || r.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ── File Browser View ──
  const fileBrowserView = selectedRepo ? (() => {
    const pathParts = currentPath ? currentPath.split('/') : []
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
          <button onClick={() => { setSelectedRepo(null); setFiles([]) }} className="text-slate-400 hover:text-brand-navy transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Github className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-bold text-brand-navy truncate">{selectedRepo.fullName}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">{selectedRepo.defaultBranch}</span>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-brand-navy transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs">
          <button onClick={() => loadFiles(selectedRepo, '')} className="text-slate-500 hover:text-brand-navy">/</button>
          {pathParts.map((part, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3 text-slate-300" />
              {i < pathParts.length - 1 ? (
                <button
                  onClick={() => handleNavigateDir(pathParts.slice(0, i + 1).join('/'))}
                  className="text-slate-500 hover:text-brand-navy"
                >
                  {part}
                </button>
              ) : (
                <span className="text-brand-navy font-medium">{part}</span>
              )}
            </span>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100">
          {importing === 'all' ? (
            <span className="flex items-center gap-1 text-xs text-slate-500"><Loader2 className="w-3 h-3 animate-spin" /> Importando...</span>
          ) : (
            <>
              <button
                onClick={handleImportAllTerraform}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-navy text-brand-lime rounded-lg text-xs font-bold hover:bg-brand-navy/90 transition-colors"
              >
                <Database className="w-3.5 h-3.5" /> Importar tudo (.tf)
              </button>
              <button
                onClick={async () => {
                  const sourceFiles: { fileName: string; path: string; content: string }[] = []
                  for (const file of files) {
                    if (file.type !== 'file') continue
                    const ext = file.name.split('.').pop()?.toLowerCase()
                    if (!ext || ['png','jpg','jpeg','gif','svg','ico','woff','woff2','ttf','eot','pdf','zip','tar','gz','mp4','webm'].includes(ext)) continue
                    try {
                      const resp = await fetch(
                        `${API_BASE}/github/repos/${selectedRepo.owner}/${selectedRepo.name}/file?path=${encodeURIComponent(file.path)}&branch=${selectedRepo.defaultBranch}`,
                        { headers: { 'Authorization': `Bearer ${token}` } }
                      )
                      const data = await resp.json()
                      if (data.content) {
                        sourceFiles.push({ fileName: file.name, path: file.path, content: data.content })
                      }
                    } catch { /* skip unreadable files */ }
                  }
                  setAnalysisFiles(sourceFiles)
                  setAnalysisRepo(selectedRepo.fullName)
                  setShowCodeAnalysis(true)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-brand-navy rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                <Code2 className="w-3.5 h-3.5" /> Analisar Código
              </button>
            </>
          )}
          {importing && importing !== 'all' && (
            <span className="flex items-center gap-1 text-xs text-slate-500"><Loader2 className="w-3 h-3 animate-spin" /> Importando {importing}...</span>
          )}
        </div>

        {/* Files */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="mx-4 mt-3 px-4 py-2 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700">{error}</div>
          )}
          {filesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400">Pasta vazia</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {currentPath && (
                <div
                  onClick={handleGoBack}
                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500">..</span>
                </div>
              )}
              {files.map((file) => (
                <div
                  key={file.path}
                  onClick={() => {
                    if (file.type === 'dir') handleNavigateDir(file.path)
                    else if (importing !== file.path) handleImportFile(file)
                  }}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors',
                    importing === file.path && 'opacity-50'
                  )}
                >
                  {file.type === 'dir' ? (
                    <Folder className="w-4 h-4 text-blue-400" />
                  ) : (
                    <FileText className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="flex-1 text-sm text-slate-700 truncate">{file.name}</span>
                  {file.type === 'file' && (
                    <span className="text-[10px] text-slate-400">
                      {file.size > 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${file.size} B`}
                    </span>
                  )}
                  {(file.name.endsWith('.tf') || file.name.endsWith('.tfstate')) && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-lime/20 text-brand-navy font-mono">
                      {file.name.endsWith('.tfstate') ? 'state' : 'hcl'}
                    </span>
                  )}
                  {importing === file.path && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-lime" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  })() : null

  // ── Repo List View ──
  const repoListView = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <Github className="w-4 h-4 text-slate-600" />
        <span className="text-sm font-bold text-brand-navy flex-1">Seus Repositórios</span>
        <button onClick={onClose} className="text-slate-400 hover:text-brand-navy transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="px-4 py-2 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar repositório..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-lime/60 focus:border-brand-navy placeholder:text-slate-300"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
          </div>
        ) : error ? (
          <div className="m-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{error}</div>
        ) : filteredRepos.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-400">
            {searchQuery ? 'Nenhum repositório encontrado' : 'Nenhum repositório disponível'}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredRepos.map((repo) => (
              <div
                key={repo.id}
                onClick={() => handleSelectRepo(repo)}
                className="px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Folder className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-brand-navy">{repo.fullName}</span>
                  {repo.isPrivate && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">privado</span>
                  )}
                </div>
                {repo.description && (
                  <p className="text-xs text-slate-400 ml-6 line-clamp-1">{repo.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1 ml-6">
                  {repo.language && (
                    <span className="text-[10px] text-slate-400">{repo.language}</span>
                  )}
                  <span className="text-[10px] text-slate-300">{repo.defaultBranch}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  // ── Single return with dialog ──
  return (
    <>
      <CodeAnalysisReviewDialog
        open={showCodeAnalysis}
        onOpenChange={setShowCodeAnalysis}
        files={analysisFiles}
        repoUrl={analysisRepo}
      />
      {selectedRepo ? fileBrowserView : repoListView}
    </>
  )
}
