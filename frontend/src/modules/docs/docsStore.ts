import { create } from 'zustand'
import { api } from '@/api/client'

export interface DocTreeItem {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: DocTreeItem[]
  title?: string
}

export interface DocContent {
  path: string
  title: string
  content: string
  checksum?: string
  lastModified?: string
}

export interface StaleDoc {
  path: string
  title: string
  entityType: string
  entityName: string
  lastSync: string
}

interface DocsState {
  tree: DocTreeItem[]
  activeDoc: DocContent | null
  rawContent: string
  loading: boolean
  importing: boolean
  searchResults: DocTreeItem[]
  searchQuery: string
  staleDocs: StaleDoc[]

  fetchTree: () => Promise<void>
  fetchDoc: (path: string) => Promise<void>
  searchDocs: (query: string) => Promise<void>
  importDoc: (file: File) => Promise<void>
  scanDirectory: () => Promise<void>
  generateDoc: (canvasId?: string) => Promise<void>
  setActiveDoc: (doc: DocContent | null) => void
}

export const useDocsStore = create<DocsState>((set, get) => ({
  tree: [],
  activeDoc: null,
  rawContent: '',
  loading: false,
  importing: false,
  searchResults: [],
  searchQuery: '',
  staleDocs: [],

  fetchTree: async () => {
    set({ loading: true })
    try {
      const tree = await api.get<DocTreeItem[]>('/docs/tree')
      set({ tree })
    } catch {
      // Fallback: build tree from known docs dirs
      set({
        tree: [
          {
            name: 'docs',
            path: 'docs',
            type: 'directory',
            children: [
              {
                name: 'architecture',
                path: 'docs/architecture',
                type: 'directory',
                children: [
                  { name: 'README.md', path: 'docs/architecture/README.md', type: 'file', title: 'Arquitetura do Sistema' },
                  { name: 'adr-008-native-observability.md', path: 'docs/architecture/adr-008-native-observability.md', type: 'file', title: 'ADR-008: Observabilidade Nativa' },
                  { name: 'adr-009-auto-documentation.md', path: 'docs/architecture/adr-009-auto-documentation.md', type: 'file', title: 'ADR-009: Auto-Documentation' },
                ],
              },
            ],
          },
        ],
      })
    } finally {
      set({ loading: false })
    }
  },

  fetchDoc: async (path: string) => {
    set({ loading: true, activeDoc: null })
    try {
      const doc = await api.get<DocContent>(`/docs/content?path=${encodeURIComponent(path)}`)
      set({ activeDoc: doc, rawContent: doc.content })
    } catch {
      // Fallback: Just set path as active with no content
      set({
        activeDoc: {
          path,
          title: path.split('/').pop()?.replace('.md', '') || path,
          content: '## Documento indisponível\n\nO servidor de documentação não está disponível. Acesse os arquivos `.md` diretamente no repositório.',
        },
      })
    } finally {
      set({ loading: false })
    }
  },

  searchDocs: async (query: string) => {
    set({ searchQuery: query, searchResults: [] })
    if (!query.trim()) {
      set({ searchResults: [] })
      return
    }
    try {
      const results = await api.get<DocTreeItem[]>(`/docs/search?q=${encodeURIComponent(query)}`)
      set({ searchResults: results })
    } catch {
      // Fallback: filter tree locally
      const all = get().tree
      const filterTree = (items: DocTreeItem[]): DocTreeItem[] => {
        return items.flatMap((item) => {
          if (item.type === 'file' && item.name.toLowerCase().includes(query.toLowerCase())) {
            return [item]
          }
          if (item.children) return filterTree(item.children)
          return []
        })
      }
      set({ searchResults: filterTree(all) })
    }
  },

  importDoc: async (file: File) => {
    set({ importing: true })
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/v1/docs/import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('cloudbuilder-auth-token')}` },
        body: formData,
      })
      if (response.ok) {
        await get().fetchTree()
      }
    } catch {
      // Silent fallback
    } finally {
      set({ importing: false })
    }
  },

  scanDirectory: async () => {
    set({ importing: true })
    try {
      await api.post('/docs/scan')
      await get().fetchTree()
    } catch {
      // Silent fallback
    } finally {
      set({ importing: false })
    }
  },

  generateDoc: async (canvasId?: string) => {
    set({ loading: true })
    try {
      if (canvasId) {
        const result = await api.post<DocContent>('/docs/generate', { canvasId })
        set({ activeDoc: result })
        await get().fetchTree()
      }
    } catch {
      // Silent fallback
    } finally {
      set({ loading: false })
    }
  },

  setActiveDoc: (doc) => set({ activeDoc: doc }),
}))
