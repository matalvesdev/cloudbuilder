import { useCallback, useState, useEffect } from 'react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import {
  Save,
  Download,
  Upload,
  CheckCircle,
  FileCode,
  Sparkles,
  LayoutGrid,
  Copy,
  Plus,
} from 'lucide-react'
import { useCanvasStore } from '@/store/canvasStore'
import { allComponents } from './properties/providerDefinitions'
import { ServiceIcon } from '../nodes/providerIcons'
import { downloadCanvasJson } from '../services'

interface CanvasCommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNewDesign: () => void
  onSave: () => void
  onToggleSnap: () => void
}

export function CanvasCommandPalette({ open, onOpenChange, onNewDesign, onSave, onToggleSnap }: CanvasCommandPaletteProps) {
  const { addNode, autoLayout, duplicateSelected, clearCanvas } = useCanvasStore()
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open) setSearch('')
  }, [open])

  const handleSelect = useCallback((value: string) => {
    onOpenChange(false)
    const [type, id] = value.split(':')

    switch (type) {
      case 'action':
        switch (id) {
          case 'new': onNewDesign(); break
          case 'save': onSave(); break
          case 'export': downloadCanvasJson(); break
          case 'layout': autoLayout(); break
          case 'duplicate': duplicateSelected(); break
          case 'snap': onToggleSnap(); break
        }
        break
      case 'component': {
        const comp = allComponents.find(c => c.id === id)
        if (comp) {
          addNode(comp, { x: 200 + Math.random() * 100, y: 200 + Math.random() * 100 })
        }
        break
      }
    }
  }, [onOpenChange, onNewDesign, onSave, addNode, autoLayout, duplicateSelected, onToggleSnap])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar comandos ou componentes..." value={search} onValueChange={setSearch} />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado</CommandEmpty>
        <CommandGroup heading="Ações">
          <CommandItem value="action:new" onSelect={() => handleSelect('action:new')}>
            <Plus className="mr-2 h-4 w-4" />
            Novo design
          </CommandItem>
          <CommandItem value="action:save" onSelect={() => handleSelect('action:save')}>
            <Save className="mr-2 h-4 w-4" />
            Salvar
          </CommandItem>
          <CommandItem value="action:export" onSelect={() => handleSelect('action:export')}>
            <Download className="mr-2 h-4 w-4" />
            Exportar canvas
          </CommandItem>
          <CommandItem value="action:layout" onSelect={() => handleSelect('action:layout')}>
            <LayoutGrid className="mr-2 h-4 w-4" />
            Organizar nós
          </CommandItem>
          <CommandItem value="action:duplicate" onSelect={() => handleSelect('action:duplicate')}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicar selecionados
          </CommandItem>
          <CommandItem value="action:snap" onSelect={() => handleSelect('action:snap')}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Alternar snap ao grid
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Componentes">
          {allComponents.map((comp) => (
            <CommandItem key={comp.id} value={`component:${comp.id}`} onSelect={() => handleSelect(`component:${comp.id}`)}>
              <div className="mr-2 w-5 h-5 rounded flex items-center justify-center shrink-0 bg-slate-100">
                <ServiceIcon componentId={comp.id} size={14} />
              </div>
              <span>{comp.displayName}</span>
              <span className="ml-auto text-[10px] font-mono text-slate-400">{comp.provider.toUpperCase()}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
