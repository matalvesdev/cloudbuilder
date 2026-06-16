import { useState, useMemo } from 'react'
import {
  Building2,
  Plus,
  Trash2,
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserMinus,
  Crown,
  Settings,
  CheckCircle2,
  XCircle,
  Loader2,
  Mail,
  Search,
  ArrowLeft,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTenantStore } from '@/store/tenantStore'
import type { Project, ProjectMember, ProjectRole, InviteRequest } from '@/types/tenant.types'
import { ROLE_LABELS, ROLE_HIERARCHY } from '@/types/tenant.types'

const ROLE_OPTIONS: { value: ProjectRole; label: string; desc: string; icon: typeof Shield }[] = [
  { value: 'admin', label: 'Admin', desc: 'Pode gerenciar membros e configurações', icon: Shield },
  { value: 'member', label: 'Membro', desc: 'Pode criar e editar recursos', icon: ShieldCheck },
  { value: 'viewer', label: 'Visualizador', desc: 'Acesso somente leitura', icon: ShieldAlert },
]

function CreateProjectDialog({ open, onClose, onCreated }: {
  open: boolean
  onClose: () => void
  onCreated: (project: Project) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const { createProject } = useTenantStore()

  if (!open) return null

  const handleCreate = () => {
    if (!name.trim()) return
    const project = createProject(name.trim(), description.trim())
    onCreated(project)
    setName('')
    setDescription('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-brand-navy font-display">Novo Projeto</h2>
          <p className="text-xs text-slate-400 mt-0.5">Crie um novo projeto para isolar designs, credenciais e ambientes</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Nome do Projeto
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy bg-white transition-all"
              placeholder="Ex: Produção, Staging, Cliente X"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-20 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy bg-white transition-all resize-none"
              placeholder="Descrição opcional do projeto"
            />
          </div>
        </div>
        <div className="p-6 pt-0 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 h-9 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Criar Projeto
          </button>
        </div>
      </div>
    </div>
  )
}

function InviteMemberDialog({ open, projectId, onClose }: {
  open: boolean
  projectId: string
  onClose: () => void
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ProjectRole>('member')
  const [sending, setSending] = useState(false)
  const { inviteMember } = useTenantStore()

  if (!open) return null

  const handleInvite = async () => {
    if (!email.trim()) return
    setSending(true)
    await new Promise((r) => setTimeout(r, 500))
    const invite: InviteRequest = { email: email.trim(), role }
    inviteMember(projectId, invite)
    setSending(false)
    setEmail('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-brand-navy font-display">Convidar Membro</h2>
          <p className="text-xs text-slate-400 mt-0.5">Envie um convite para participar do projeto</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy bg-white transition-all"
                placeholder="email@exemplo.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Papel
            </label>
            <div className="grid gap-2">
              {ROLE_OPTIONS.map((opt) => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.value}
                    onClick={() => setRole(opt.value)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left',
                      role === opt.value
                        ? 'border-brand-navy bg-brand-navy/5'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      role === opt.value ? 'bg-brand-navy text-brand-lime' : 'bg-slate-100 text-slate-500'
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-navy">{opt.label}</p>
                      <p className="text-[11px] text-slate-400">{opt.desc}</p>
                    </div>
                    {role === opt.value && (
                      <CheckCircle2 className="w-4 h-4 text-brand-navy ml-auto" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        <div className="p-6 pt-0 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 h-9 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleInvite}
            disabled={sending || !email.trim()}
            className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {sending ? 'Convidando...' : 'Convidar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ProjectCard({ project, isActive, onSelect, onDelete }: {
  project: Project
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'bg-white border rounded-xl p-4 shadow-sm cursor-pointer transition-all',
        isActive ? 'border-brand-navy ring-1 ring-brand-navy/20' : 'border-slate-200 hover:shadow-md'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          isActive ? 'bg-brand-navy' : 'bg-ice-blue'
        )}>
          <Building2 className={cn('w-5 h-5', isActive ? 'text-brand-lime' : 'text-brand-navy')} />
        </div>
        {isActive && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-brand-navy text-brand-lime">
            Ativo
          </span>
        )}
      </div>
      <h4 className="text-sm font-bold text-brand-navy truncate">{project.name}</h4>
      {project.description && (
        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{project.description}</p>
      )}
      <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Users className="w-3 h-3" />
          {project.memberCount} membro{project.memberCount !== 1 ? 's' : ''}
        </span>
        <span>{project.resourceCount} recurso{project.resourceCount !== 1 ? 's' : ''}</span>
        <span>{new Date(project.createdAt).toLocaleDateString('pt-BR')}</span>
      </div>
      {isActive && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 h-7 rounded-lg text-[10px] font-semibold text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-200"
        >
          <Trash2 className="w-3 h-3" />
          Excluir Projeto
        </button>
      )}
    </div>
  )
}

function MembersList({ projectId }: { projectId: string }) {
  const { members, getProjectMembers, removeMember, updateMemberRole } = useTenantStore()
  const projectMembers = getProjectMembers(projectId)
  const [editingRole, setEditingRole] = useState<string | null>(null)

  if (projectMembers.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-xs text-slate-400">Nenhum membro neste projeto</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {projectMembers.map((member) => {
        const isOwner = member.role === 'owner'
        return (
          <div
            key={member.id}
            className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-navy flex items-center justify-center">
                <span className="text-[11px] font-bold text-brand-lime">
                  {member.userName.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-brand-navy">{member.userName}</span>
                  {isOwner && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                      <Crown className="w-2.5 h-2.5" />
                      Owner
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">{member.userEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isOwner ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <Crown className="w-3 h-3" />
                  {ROLE_LABELS[member.role]}
                </span>
              ) : (
                <select
                  value={member.role}
                  onChange={(e) => {
                    updateMemberRole(projectId, member.id, e.target.value as ProjectRole)
                  }}
                  className="text-[10px] bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-600 cursor-pointer"
                >
                  {ROLE_HIERARCHY.filter((r) => r !== 'owner').map((role) => (
                    <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                  ))}
                </select>
              )}
              {!isOwner && (
                <button
                  onClick={() => removeMember(projectId, member.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function MultiTenantSettings() {
  const { projects, activeProjectId, switchProject, deleteProject } = useTenantStore()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [view, setView] = useState<'grid' | 'detail'>('grid')

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId),
    [projects, activeProjectId]
  )

  const filteredProjects = useMemo(
    () => projects.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [projects, searchTerm]
  )

  const handleProjectCreated = (project: Project) => {
    setView('detail')
  }

  const handleDeleteProject = (projectId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este projeto? Todos os dados associados serão perdidos.')) {
      deleteProject(projectId)
      if (projects.length <= 1) {
        setView('grid')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-ice-blue flex items-center justify-center">
            <Building2 className="w-4 h-4 text-brand-navy" />
          </div>
          <div>
            <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-400">Multitenancy</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Gerencie projetos e times com isolamento completo</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {view === 'detail' && (
            <button
              onClick={() => setView('grid')}
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar
            </button>
          )}
          <button
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center gap-1.5 px-4 h-8 rounded-full text-[11px] font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo Projeto
          </button>
        </div>
      </div>

      {view === 'grid' && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy bg-white transition-all"
              placeholder="Buscar projetos..."
            />
          </div>

          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-ice-blue flex items-center justify-center mb-4">
                <Building2 className="w-7 h-7 text-brand-navy" />
              </div>
              <p className="text-sm font-semibold text-brand-navy mb-1">Nenhum projeto</p>
              <p className="text-xs text-slate-400 mb-4 max-w-sm">
                Crie projetos para isolar ambientes, credenciais e designs de diferentes times ou clientes.
              </p>
              <button
                onClick={() => setShowCreateDialog(true)}
                className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all"
              >
                <Plus className="w-4 h-4" />
                Criar Projeto
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isActive={project.id === activeProjectId}
                  onSelect={() => {
                    switchProject(project.id)
                    setView('detail')
                  }}
                  onDelete={() => handleDeleteProject(project.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {view === 'detail' && activeProject && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-navy flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-brand-lime" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-brand-navy font-display">{activeProject.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{activeProject.description || 'Sem descrição'}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                    <span>{activeProject.memberCount} membro{activeProject.memberCount !== 1 ? 's' : ''}</span>
                    <span>{activeProject.resourceCount} recurso{activeProject.resourceCount !== 1 ? 's' : ''}</span>
                    <span>Criado em {new Date(activeProject.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDeleteProject(activeProject.id)}
                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-ice-blue/50 rounded-xl p-4 text-center border border-ice-blue">
                <p className="text-2xl font-bold text-brand-navy">{activeProject.memberCount}</p>
                <p className="text-[10px] text-slate-500 font-medium">Membros</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
                <p className="text-2xl font-bold text-green-700">{activeProject.resourceCount}</p>
                <p className="text-[10px] text-green-600 font-medium">Recursos</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-200">
                <p className="text-2xl font-bold text-amber-700">{activeProject.id.substring(0, 8)}</p>
                <p className="text-[10px] text-amber-600 font-medium">ID do Projeto</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-ice-blue flex items-center justify-center">
                  <Users className="w-4 h-4 text-brand-navy" />
                </div>
                <div>
                  <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-400">Membros</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Gerencie quem tem acesso a este projeto</p>
                </div>
              </div>
              <button
                onClick={() => setShowInviteDialog(true)}
                className="inline-flex items-center gap-1.5 px-4 h-8 rounded-full text-[11px] font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Convidar
              </button>
            </div>
            <MembersList projectId={activeProject.id} />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Settings className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-400">Isolamento do Projeto</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Este projeto possui isolamento completo de recursos</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Designs', desc: 'Canvas e diagramas isolados por projeto', active: true },
                { label: 'Credenciais', desc: 'Credenciais de nuvem não compartilhadas', active: true },
                { label: 'Ambientes', desc: 'Ambientes de deploy exclusivos do projeto', active: true },
              ].map((item) => (
                <div key={item.label} className={cn(
                  'rounded-xl p-4 border text-center',
                  item.active ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'
                )}>
                  {item.active
                    ? <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    : <XCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  }
                  <p className="text-xs font-semibold text-brand-navy">{item.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <CreateProjectDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreated={handleProjectCreated}
      />

      <InviteMemberDialog
        open={showInviteDialog}
        projectId={activeProject?.id || ''}
        onClose={() => setShowInviteDialog(false)}
      />
    </div>
  )
}
