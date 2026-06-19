import { useEffect, useState, useMemo, useCallback, type ReactNode } from 'react'
import {
  FileText, Folder, FolderOpen, Search,
  Upload, Sparkles, Loader2, ChevronRight,
  BookOpen, Hash, CheckCircle2, AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import { useDocsStore, type DocTreeItem } from './docsStore'
import { fetchDocTree, fetchDocContent, searchDocs, fetchStaleDocs } from '@/api/docs'
import type { StaleDoc } from './docsStore'
import { cn } from '@/lib/utils'
import { showSuccess, showError } from '@/lib/toast'

/* ──────────────── Renderer de Markdown Nativo ──────────────── */

function renderMarkdown(md: string): string {
  if (!md) return ''

  let html = md

  // Code blocks (triple backticks) — must come before inline code
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    const langClass = lang ? ` class="lang-${lang}"` : ''
    return `<pre class="code-block"><code${langClass}>${escaped}</code></pre>`
  })

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')

  // Headers
  html = html.replace(/^###### (.*$)/gm, '<h6>$1</h6>')
  html = html.replace(/^##### (.*$)/gm, '<h5>$1</h5>')
  html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>')
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>')

  // Bold + Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr />')

  // Unordered lists
  html = html.replace(/^\s*[-*]\s+(.*)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)

  // Ordered lists
  html = html.replace(/^\s*\d+\.\s+(.*)$/gm, '<li>$1</li>')

  // Tables
  html = html.replace(/\|(.+)\|/g, (_match, content) => {
    const cells = content.split('|').map((c: string) => c.trim())
    const isHeader = cells[0] && cells[0].includes('---')
    if (isHeader) return ''
    return `<tr>${cells.map((c: string) => `<td>${c}</td>`).join('')}</tr>`
  })
  html = html.replace(/(<tr>.*<\/tr>\n?)+/g, (match) => `<table><tbody>${match}</tbody></table>`)

  // Paragraphs (catch-all for remaining text lines)
  const lines = html.split('\n')
  const result: string[] = []
  let inBlock = false

  for (const line of lines) {
    const trimmed = line.trim()

    // Skip mermaid code blocks visually (they'll render as plaintext placeholder)
    if (trimmed.startsWith('```')) {
      if (inBlock) { inBlock = false; continue }
      inBlock = trimmed.includes('mermaid')
      continue
    }
    if (inBlock) continue

    // Skip lines that are already wrapped in block-level tags
    if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li') ||
        trimmed.startsWith('<pre') || trimmed.startsWith('<table') || trimmed.startsWith('<tr') ||
        trimmed.startsWith('<td') || trimmed.startsWith('<hr') || trimmed.startsWith('<p') ||
        trimmed.startsWith('<a') || trimmed === '' || trimmed.startsWith('<')) {
      if (trimmed) result.push(trimmed)
      continue
    }

    result.push(`<p>${trimmed}</p>`)
  }

  return result.join('\n')
}

/* ──────────────── Subcomponents ──────────────── */

function TocSidebar({ content }: { content: string }) {
  const headings = useMemo(() => {
    const matches = content.match(/^(#{2,4})\s+(.+)$/gm)
    if (!matches) return []
    return matches.map((h) => {
      const level = h.match(/^(#+)/)?.[1].length || 2
      const text = h.replace(/^#+\s+/, '').trim()
      return { level, text, id: text.toLowerCase().replace(/[^a-z0-9]+/g, '-') }
    })
  }, [content])

  if (headings.length === 0) return null

  return (
    <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex items-center gap-2 mb-3">
        <Hash className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Neste documento</span>
      </div>
      <nav className="space-y-1">
        {headings.map((h) => (
          <a
            key={h.id}
            href={`#${h.id}`}
            className={cn(
              'block text-xs text-slate-500 hover:text-brand-navy transition-colors rounded px-2 py-1 hover:bg-white',
              h.level === 2 ? 'font-medium' : 'pl-6'
            )}
            onClick={(e) => {
              e.preventDefault()
              document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            {h.text}
          </a>
        ))}
      </nav>
    </div>
  )
}

function StaleBanner({ staleDocs, onNavigate }: { staleDocs: StaleDoc[]; onNavigate: (path: string) => void }) {
  if (staleDocs.length === 0) return null

  return (
    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-bold text-amber-800">Documentação desatualizada</p>
          <p className="text-[11px] text-amber-600 mt-0.5">
            {staleDocs.length} documento(s) não refletem o estado atual do sistema.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {staleDocs.map((s) => (
              <button
                key={s.path}
                onClick={() => onNavigate(s.path)}
                className="inline-flex items-center gap-1 px-2.5 h-6 rounded-lg text-[10px] font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors"
              >
                {s.title} <ChevronRight className="w-2.5 h-2.5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ──────────────── Tree Node ──────────────── */

function TreeNode({
  item, depth, activePath, onSelect, expandedPaths, onToggle,
}: {
  item: DocTreeItem; depth: number; activePath: string | null
  onSelect: (path: string) => void
  expandedPaths: Set<string>; onToggle: (path: string) => void
}) {
  const isExpanded = expandedPaths.has(item.path)
  const isActive = activePath === item.path

  if (item.type === 'directory') {
    return (
      <div>
        <button
          onClick={() => onToggle(item.path)}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all text-left',
            isExpanded ? 'bg-ice-blue/40 text-brand-navy font-semibold' : 'text-slate-500 hover:text-brand-navy hover:bg-slate-100'
          )}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          {isExpanded ? (
            <FolderOpen className="w-3.5 h-3.5 shrink-0 text-brand-navy" />
          ) : (
            <Folder className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          )}
          <span className="truncate">{item.name}</span>
          <ChevronRight className={cn('w-3 h-3 ml-auto shrink-0 transition-transform', isExpanded && 'rotate-90')} />
        </button>
        {isExpanded && item.children?.map((child) => (
          <TreeNode
            key={child.path}
            item={child}
            depth={depth + 1}
            activePath={activePath}
            onSelect={onSelect}
            expandedPaths={expandedPaths}
            onToggle={onToggle}
          />
        ))}
      </div>
    )
  }

  return (
    <button
      onClick={() => onSelect(item.path)}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all text-left',
        isActive
          ? 'bg-brand-navy text-white font-semibold shadow-sm'
          : 'text-slate-500 hover:text-brand-navy hover:bg-slate-100'
      )}
      style={{ paddingLeft: `${12 + depth * 16}px` }}
    >
      <FileText className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">{item.title || item.name.replace('.md', '')}</span>
    </button>
  )
}

/* ──────────────── Main Module ──────────────── */

export function DocsModule() {
  const { tree, activeDoc, loading, importing, setActiveDoc } = useDocsStore()
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set(['docs']))
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<DocTreeItem[]>([])
  const [staleDocs, setStaleDocs] = useState<StaleDoc[]>([])
  const [showImportMenu, setShowImportMenu] = useState(false)

  const fetchTree = useCallback(async () => {
    try {
      const t = await fetchDocTree()
      useDocsStore.setState({ tree: t })
    } catch {
      useDocsStore.getState().fetchTree()
    }
  }, [])

  const openDoc = useCallback(async (path: string) => {
    try {
      const doc = await fetchDocContent(path)
      setActiveDoc(doc)
    } catch {
      // Fallback: read from local store
      useDocsStore.getState().fetchDoc(path)
    }
    // Auto-expand parent directories
    const parts = path.split('/')
    for (let i = 1; i <= parts.length; i++) {
      const parentPath = parts.slice(0, i).join('/')
      setExpandedPaths((prev) => new Set(prev).add(parentPath))
    }
  }, [setActiveDoc])

  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q)
    if (!q.trim()) {
      setSearchResults([])
      return
    }
    try {
      const results = await searchDocs(q)
      setSearchResults(results)
    } catch {
      setSearchResults([])
    }
  }, [])

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.name.endsWith('.md')) {
      showError('Apenas arquivos .md são aceitos')
      return
    }
    try {
      const formData = new FormData()
      formData.append('file', file)
      const resp = await fetch('/api/v1/docs/import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('cloudbuilder-auth-token')}` },
        body: formData,
      })
      if (resp.ok) {
        showSuccess(`"${file.name}" importado com sucesso`)
        fetchTree()
      } else {
        showError('Falha ao importar arquivo')
      }
    } catch {
      showError('Erro de conexão ao importar')
    }
    e.target.value = ''
  }, [fetchTree])

  const handleScan = useCallback(async () => {
    try {
      await fetch('/api/v1/docs/scan', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('cloudbuilder-auth-token')}` },
      })
      showSuccess('Diretório escaneado com sucesso')
      fetchTree()
    } catch {
      showError('Falha ao escanear diretório')
    }
  }, [fetchTree])

  useEffect(() => {
    fetchTree()
    fetchStaleDocs().then(setStaleDocs).catch(() => {})
  }, [fetchTree])

  // Render doc content with anchors for headings
  const renderedContent = useMemo(() => {
    if (!activeDoc?.content) return ''
    const html = renderMarkdown(activeDoc.content)

    // Add IDs to headings for anchor links
    return html.replace(/<h([2-4])>(.*?)<\/h\1>/g, (_match, level, text) => {
      const id = text.toLowerCase().replace(/<[^>]*>/g, '').replace(/[^a-z0-9]+/g, '-')
      return `<h${level} id="${id}">${text}</h${level}>`
    })
  }, [activeDoc?.content])

  const togglePath = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  return (
    <div className="h-full flex bg-white">
      {/* ═══ SIDEBAR ═══ */}
      <aside className="w-64 border-r border-slate-200 flex flex-col bg-slate-50 shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-brand-navy" />
            <h2 className="text-sm font-bold text-brand-navy font-display">Documentação</h2>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar na documentação..."
              className="w-full h-8 pl-8 pr-3 rounded-lg bg-white border border-slate-200 text-xs text-brand-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-navy/10 focus:border-brand-navy/30 transition-all"
            />
          </div>
        </div>

        {/* Search Results or Tree */}
        <div className="flex-1 overflow-y-auto p-2">
          {searchResults.length > 0 ? (
            <div className="space-y-0.5">
              <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Resultados ({searchResults.length})
              </p>
              {searchResults.map((r) => (
                <button
                  key={r.path}
                  onClick={() => { openDoc(r.path); setSearchQuery(''); setSearchResults([]) }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-ice-blue/40 hover:text-brand-navy transition-all text-left"
                >
                  <FileText className="w-3 h-3 shrink-0" />
                  <span className="truncate">{r.title || r.name}</span>
                </button>
              ))}
            </div>
          ) : searchQuery ? (
            <p className="text-xs text-slate-400 px-3 py-4 text-center">Nenhum resultado encontrado</p>
          ) : loading && tree.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : (
            tree.map((item) => (
              <TreeNode
                key={item.path}
                item={item}
                depth={0}
                activePath={activeDoc?.path ?? null}
                onSelect={openDoc}
                expandedPaths={expandedPaths}
                onToggle={togglePath}
              />
            ))
          )}
        </div>

        {/* Actions */}
        <div className="p-3 border-t border-slate-200 space-y-1.5">
          {/* Import */}
          <div className="relative">
            <button
              onClick={() => setShowImportMenu(!showImportMenu)}
              disabled={importing}
              className="w-full flex items-center justify-center gap-1.5 px-3 h-8 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-all disabled:opacity-50"
            >
              {importing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              Importar Documentação
            </button>
            {showImportMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowImportMenu(false)} />
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-xl border border-slate-200 shadow-lg z-50 p-1">
                  <label className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    Upload .md
                    <input type="file" accept=".md" className="hidden" onChange={handleImport} />
                  </label>
                  <button
                    onClick={() => { handleScan(); setShowImportMenu(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors text-left"
                  >
                    <Folder className="w-3.5 h-3.5" />
                    Escanear diretório
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Generate */}
          <button
            onClick={() => openDoc('docs/architecture/adr-009-auto-documentation.md')}
            className="w-full flex items-center justify-center gap-1.5 px-3 h-8 rounded-lg text-xs font-bold bg-brand-navy text-white hover:bg-brand-navy/90 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Gerar ADR
          </button>
        </div>
      </aside>

      {/* ═══ VIEWER ═══ */}
      <main className="flex-1 overflow-y-auto bg-white">
        {!activeDoc ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-14 h-14 rounded-2xl bg-ice-blue/50 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7 text-brand-navy" />
              </div>
              <h2 className="text-lg font-bold text-brand-navy font-display mb-1">Documentação do Sistema</h2>
              <p className="text-sm text-slate-400 mb-6">
                Selecione um documento na barra lateral para visualizar, ou importe documentação existente.
              </p>
              <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> {tree.length > 0 ? `${countFiles(tree)} arquivos` : 'Navegue'}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5" /> Busca textual
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" /> Importar .md
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-8 py-8">
            {/* Stale banner */}
            <StaleBanner staleDocs={staleDocs} onNavigate={openDoc} />

            {/* TOC sidebar */}
            <TocSidebar content={activeDoc.content} />

            {/* Rendered content */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
              </div>
            ) : (
              <article
                className="prose-custom"
                dangerouslySetInnerHTML={{ __html: renderedContent }}
              />
            )}

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3 h-3" />
                  {activeDoc.path}
                  {activeDoc.lastModified && (
                    <> · Última modificação: {new Date(activeDoc.lastModified).toLocaleDateString('pt-BR')}</>
                  )}
                </span>
                <a
                  href={`/api/v1/docs/content?path=${encodeURIComponent(activeDoc.path)}&raw=true`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-brand-navy hover:text-brand-lime transition-colors font-medium"
                >
                  <ExternalLink className="w-3 h-3" /> Raw
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function countFiles(items: DocTreeItem[]): number {
  let count = 0
  for (const item of items) {
    if (item.type === 'file') count++
    if (item.children) count += countFiles(item.children)
  }
  return count
}
