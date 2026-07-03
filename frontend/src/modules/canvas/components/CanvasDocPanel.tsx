import { useState, useEffect } from 'react'
import { FileText, Search, ChevronRight, ChevronDown } from 'lucide-react'
import { fetchDocTree, fetchDocContent, type DocNode } from '@/api/docs'

interface CanvasDocPanelProps {
  canvasId?: string
}

/**
 * CanvasDocPanel: Inline documentation viewer in the canvas bottom panel.
 * Shows a mini tree of docs and renders markdown content.
 */
export function CanvasDocPanel({ canvasId }: CanvasDocPanelProps) {
  const [tree, setTree] = useState<DocNode[]>([])
  const [activeDoc, setActiveDoc] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchDocTree().then(setTree).catch(() => {})
  }, [])

  useEffect(() => {
    if (activeDoc) {
      setLoading(true)
      fetchDocContent(activeDoc).then(setContent).finally(() => setLoading(false))
    }
  }, [activeDoc])

  const filteredTree = search
    ? tree.filter(n => n.name.toLowerCase().includes(search.toLowerCase()))
    : tree

  return (
    <div className="flex h-full">
      {/* Mini tree sidebar */}
      <div className="w-48 border-r border-slate-200 overflow-y-auto">
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar docs..."
              className="w-full text-xs pl-6 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md"
            />
          </div>
        </div>
        <div className="px-1 pb-2">
          {filteredTree.map(node => (
            <TreeNode key={node.id} node={node} activeDoc={activeDoc} onSelect={setActiveDoc} />
          ))}
        </div>
      </div>
      {/* Content viewer */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-xs text-slate-400">Carregando...</div>
        ) : content ? (
          <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono">{content}</pre>
        ) : (
          <div className="text-xs text-slate-400">Selecione um documento</div>
        )}
      </div>
    </div>
  )
}

function TreeNode({ node, activeDoc, onSelect }: { node: DocNode; activeDoc: string | null; onSelect: (path: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const isDir = node.type === 'directory'

  return (
    <div>
      <button
        className="flex items-center gap-1 w-full text-left px-2 py-1 text-xs rounded hover:bg-slate-100"
        onClick={() => isDir ? setExpanded(!expanded) : onSelect(node.path)}
      >
        {isDir ? (expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />) : <FileText className="h-3 w-3 text-slate-400" />}
        <span className={activeDoc === node.path ? 'font-bold text-brand-navy' : 'text-slate-600'}>{node.name}</span>
      </button>
      {isDir && expanded && node.children?.map(child => (
        <div key={child.id} className="pl-3">
          <TreeNode node={child} activeDoc={activeDoc} onSelect={onSelect} />
        </div>
      ))}
    </div>
  )
}
