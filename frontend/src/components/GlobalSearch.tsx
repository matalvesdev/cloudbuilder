import { useState, useEffect, useCallback } from 'react'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] top-[15%] translate-y-0">
        <DialogHeader>
          <DialogTitle className="sr-only">Pesquisa Global</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar designs, documentos, templates..."
            className="pl-9 h-11 text-sm border-slate-200 focus-visible:ring-brand-navy/20"
            autoFocus
          />
        </div>

        <div className="max-h-[400px] overflow-y-auto -mx-1 px-1">
          {query.trim() ? (
            <div className="text-center py-12">
              <Search className="w-8 h-8 mx-auto mb-3 text-slate-300" />
              <p className="text-sm text-slate-400 font-medium">Nenhum resultado encontrado</p>
              <p className="text-xs text-slate-300 mt-1">Conecte-se a um repositório para habilitar a pesquisa</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="w-8 h-8 mx-auto mb-3 text-slate-300" />
              <p className="text-sm text-slate-400 font-medium">Digite para pesquisar</p>
              <p className="text-xs text-slate-300 mt-1">Resultados aparecerão conforme você digita</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
