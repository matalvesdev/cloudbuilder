import { useEffect, useState, useCallback } from 'react'
import {
  FolderKanban, Plus, Trash2, Pencil, Loader2, Search, Calendar,
  Settings, ChevronRight, ArrowLeft,
} from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'
import { showSuccess, showApiError } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

function getActiveOrgId(): string | null {
  return localStorage.getItem('cloudbuilder-active-org-id')
}

export function ProjectsModule() {
  const { projects, loadProjects, createProject, updateProject, deleteProject, isLoading } = useProjectStore()

  // UI state
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  // Form state
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')

  // Loading per-action
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const orgId = getActiveOrgId()

  useEffect(() => { if (orgId) loadProjects(orgId) }, [orgId, loadProjects])

  // ─── CRUD ──────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!orgId || !newName.trim()) return
    setCreating(true)
    try {
      await createProject(orgId, newName.trim(), newDesc.trim())
      showSuccess('Projeto criado com sucesso')
      setCreateOpen(false)
      setNewName('')
      setNewDesc('')
    } catch (err) {
      showApiError(err, 'Erro ao criar projeto')
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = async () => {
    if (!orgId || !editId || !editName.trim()) return
    try {
      await updateProject(orgId, editId, editName.trim(), editDesc.trim())
      showSuccess('Projeto atualizado')
      setEditOpen(false)
      setEditId(null)
    } catch (err) {
      showApiError(err, 'Erro ao atualizar projeto')
    }
  }

  const handleDelete = async (projectId: string) => {
    if (!orgId) return
    setDeleting(projectId)
    try {
      await deleteProject(orgId, projectId)
      showSuccess('Projeto excluído')
      if (selectedId === projectId) setSelectedId(null)
    } catch (err) {
      showApiError(err, 'Erro ao excluir projeto')
    } finally {
      setDeleting(null)
    }
  }

  const openEdit = (p: { id: string; name: string; description: string }) => {
    setEditId(p.id)
    setEditName(p.name)
    setEditDesc(p.description)
    setEditOpen(true)
  }

  // ─── Filter ────────────────────────────────────────────────

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  )

  const selected = projects.find(p => p.id === selectedId) || null
  const cellCls = 'px-4 py-3 text-sm'

  // ─── Detail View ───────────────────────────────────────────

  if (selected) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-brand-navy"
            onClick={() => setSelectedId(null)}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
        </div>

        <div className="bg-white rounded-2xl card-shadow border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ice-blue flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-brand-navy" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-brand-navy font-display">{selected.name}</h2>
                <p className="text-xs text-slate-400">{selected.description || 'Sem descrição'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs"
                onClick={() => openEdit(selected)}
              >
                <Pencil className="w-3.5 h-3.5 mr-1" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs text-red-500 border-red-200 hover:bg-red-50"
                onClick={() => handleDelete(selected.id)}
                disabled={deleting === selected.id}
              >
                {deleting === selected.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-1">Organização</p>
              <p className="text-sm text-brand-navy font-mono">{selected.organizationId.slice(0, 8)}...</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-1">Status</p>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                selected.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${selected.active ? 'bg-green-500' : 'bg-red-500'}`} />
                {selected.active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-1">Criado em</p>
              <p className="text-sm text-slate-600">{new Date(selected.createdAt).toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-1">Atualizado em</p>
              <p className="text-sm text-slate-600">{new Date(selected.updatedAt).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-brand-navy font-display">Editar Projeto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} className="rounded-xl" />
              </div>
              <Button onClick={handleEdit} disabled={!editName.trim()} className="w-full bg-brand-navy text-white hover:bg-brand-navy/90 rounded-xl">
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // ─── List View ─────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy font-display">Projetos</h1>
          <p className="text-sm text-slate-400">Gerenciamento de projetos e ambientes</p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white rounded-2xl p-5 card-shadow border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-ice-blue p-3">
              <FolderKanban className="h-5 w-5 text-brand-navy" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Total de Projetos</p>
              <p className="text-2xl font-bold text-brand-navy">{projects.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-lime"
            placeholder="Buscar projeto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-navy text-white hover:bg-brand-navy/90 rounded-xl gap-1.5">
              <Plus className="w-4 h-4" />
              Novo Projeto
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-brand-navy font-display">Criar Novo Projeto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projName">Nome</Label>
                <Input
                  id="projName"
                  placeholder="Nome do projeto"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projDesc">Descrição</Label>
                <Input
                  id="projDesc"
                  placeholder="Descrição do projeto"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="w-full bg-brand-navy text-white hover:bg-brand-navy/90 rounded-xl"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Criar Projeto
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-2xl card-shadow border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-sm text-slate-400">
            <FolderKanban className="w-8 h-8 mb-2" />
            {search ? 'Nenhum projeto encontrado' : 'Nenhum projeto configurado'}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Projeto</th>
                <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Descrição</th>
                <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Status</th>
                <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Criado em</th>
                <th className={`${cellCls} text-right text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(p => (
                <tr
                  key={p.id}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => setSelectedId(p.id)}
                >
                  <td className={`${cellCls} font-medium text-brand-navy`}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-ice-blue flex items-center justify-center">
                        <FolderKanban className="w-4 h-4 text-brand-navy" />
                      </div>
                      {p.name}
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-auto" />
                    </div>
                  </td>
                  <td className={`${cellCls} text-slate-500`}>{p.description || '-'}</td>
                  <td className={`${cellCls}`}>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      p.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.active ? 'bg-green-500' : 'bg-red-500'}`} />
                      {p.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className={`${cellCls} text-slate-400 text-xs`}>
                    {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className={`${cellCls} text-right`}>
                    <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-400 hover:text-brand-navy"
                        onClick={() => openEdit(p)}
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                      >
                        {deleting === p.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-brand-navy font-display">Editar Projeto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} className="rounded-xl" />
            </div>
            <Button onClick={handleEdit} disabled={!editName.trim()} className="w-full bg-brand-navy text-white hover:bg-brand-navy/90 rounded-xl">
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
