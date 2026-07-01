import { useEffect, useState, useCallback } from 'react'
import {
  Users, Plus, Trash2, UserPlus, Pencil, Loader2, Search, Building2,
  Shield, Mail, Clock, CheckCircle, MoreHorizontal, Settings, LayoutGrid,
} from 'lucide-react'
import { orgApi, type Membership, type Invitation } from '@/api/organizations'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { useTeamStore } from '@/store/teamStore'
import { showSuccess, showApiError } from '@/lib/toast'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function getActiveOrgId(): string | null {
  return localStorage.getItem('cloudbuilder-active-org-id')
}

export function WorkspaceModule() {
  const [activeTab, setActiveTab] = useState('members')

  // Members state
  const [members, setMembers] = useState<Membership[]>([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [memberSearch, setMemberSearch] = useState('')

  // Invitations state
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [invitationsLoading, setInvitationsLoading] = useState(true)

  // Teams state
  const { teams, loadTeams, createTeam, updateTeam, deleteTeam, isLoading: teamsLoading } = useTeamStore()

  // Dialogs
  const [inviteOpen, setInviteOpen] = useState(false)
  const [createTeamOpen, setCreateTeamOpen] = useState(false)
  const [editTeamOpen, setEditTeamOpen] = useState(false)
  const [editTeamId, setEditTeamId] = useState<string | null>(null)

  // Form state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('MEMBER')
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamDesc, setNewTeamDesc] = useState('')
  const [editTeamName, setEditTeamName] = useState('')
  const [editTeamDesc, setEditTeamDesc] = useState('')

  // Loading per-action
  const [inviting, setInviting] = useState(false)
  const [creatingTeam, setCreatingTeam] = useState(false)
  const [deletingTeam, setDeletingTeam] = useState<string | null>(null)
  const [removingMember, setRemovingMember] = useState<string | null>(null)
  const [cancellingInvite, setCancellingInvite] = useState<string | null>(null)

  const orgId = getActiveOrgId()

  // ─── Data fetching ──────────────────────────────────────────

  const fetchMembers = useCallback(async () => {
    if (!orgId) return
    setMembersLoading(true)
    try {
      const data = await orgApi.listMemberships(orgId)
      setMembers(Array.isArray(data) ? data : [])
    } catch {
      setMembers([])
    } finally {
      setMembersLoading(false)
    }
  }, [orgId])

  const fetchInvitations = useCallback(async () => {
    if (!orgId) return
    setInvitationsLoading(true)
    try {
      const data = await orgApi.listInvitations(orgId)
      setInvitations(Array.isArray(data) ? data : [])
    } catch {
      setInvitations([])
    } finally {
      setInvitationsLoading(false)
    }
  }, [orgId])

  useEffect(() => { fetchMembers() }, [fetchMembers])
  useEffect(() => { fetchInvitations() }, [fetchInvitations])
  useEffect(() => { if (orgId) loadTeams(orgId) }, [orgId, loadTeams])

  // ─── Member actions ─────────────────────────────────────────

  const handleInvite = async () => {
    if (!orgId || !inviteEmail.trim()) return
    setInviting(true)
    try {
      await orgApi.createInvitation(orgId, inviteEmail.trim(), inviteRole)
      showSuccess('Convite enviado com sucesso')
      setInviteOpen(false)
      setInviteEmail('')
      setInviteRole('MEMBER')
      await fetchInvitations()
    } catch (err) {
      showApiError(err, 'Erro ao enviar convite')
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (membershipId: string) => {
    if (!orgId) return
    setRemovingMember(membershipId)
    try {
      await orgApi.removeMember(orgId, membershipId)
      showSuccess('Membro removido')
      setMembers(prev => prev.filter(m => m.id !== membershipId))
    } catch (err) {
      showApiError(err, 'Erro ao remover membro')
    } finally {
      setRemovingMember(null)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    if (!orgId) return
    setCancellingInvite(invitationId)
    try {
      await orgApi.cancelInvitation(orgId, invitationId)
      showSuccess('Convite cancelado')
      setInvitations(prev => prev.filter(i => i.id !== invitationId))
    } catch (err) {
      showApiError(err, 'Erro ao cancelar convite')
    } finally {
      setCancellingInvite(null)
    }
  }

  // ─── Team actions ───────────────────────────────────────────

  const handleCreateTeam = async () => {
    if (!orgId || !newTeamName.trim()) return
    setCreatingTeam(true)
    try {
      await createTeam(orgId, newTeamName.trim(), newTeamDesc.trim())
      showSuccess('Squad criado com sucesso')
      setCreateTeamOpen(false)
      setNewTeamName('')
      setNewTeamDesc('')
    } catch (err) {
      showApiError(err, 'Erro ao criar squad')
    } finally {
      setCreatingTeam(false)
    }
  }

  const handleEditTeam = async () => {
    if (!orgId || !editTeamId || !editTeamName.trim()) return
    try {
      await updateTeam(orgId, editTeamId, editTeamName.trim(), editTeamDesc.trim())
      showSuccess('Squad atualizado')
      setEditTeamOpen(false)
      setEditTeamId(null)
    } catch (err) {
      showApiError(err, 'Erro ao atualizar squad')
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (!orgId) return
    setDeletingTeam(teamId)
    try {
      await deleteTeam(orgId, teamId)
      showSuccess('Squad excluído')
    } catch (err) {
      showApiError(err, 'Erro ao excluir squad')
    } finally {
      setDeletingTeam(null)
    }
  }

  const openEditTeam = (team: { id: string; name: string; description: string }) => {
    setEditTeamId(team.id)
    setEditTeamName(team.name)
    setEditTeamDesc(team.description)
    setEditTeamOpen(true)
  }

  // ─── Filters ────────────────────────────────────────────────

  const filteredMembers = members.filter(m =>
    m.userId.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.role.toLowerCase().includes(memberSearch.toLowerCase())
  )

  const roleLabel = (role: string) => {
    const map: Record<string, string> = { OWNER: 'Proprietário', ADMIN: 'Admin', MEMBER: 'Membro', GUEST: 'Convidado' }
    return map[role] || role
  }

  const statusLabel = (status: string) => {
    const map: Record<string, string> = { ACTIVE: 'Ativo', INVITED: 'Convidado', DISABLED: 'Desabilitado' }
    return map[status] || status
  }

  const cellCls = 'px-4 py-3 text-sm'

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy font-display">Workspace</h1>
          <p className="text-sm text-slate-400">Gerenciamento de membros, squads e configurações</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 card-shadow border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-ice-blue p-3">
              <Users className="h-5 w-5 text-brand-navy" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Membros</p>
              <p className="text-2xl font-bold text-brand-navy">{members.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 card-shadow border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-ice-blue p-3">
              <LayoutGrid className="h-5 w-5 text-brand-navy" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Squads</p>
              <p className="text-2xl font-bold text-brand-navy">{teams.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 card-shadow border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-ice-blue p-3">
              <Mail className="h-5 w-5 text-brand-navy" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Convites</p>
              <p className="text-2xl font-bold text-brand-navy">{invitations.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border border-slate-200 rounded-xl p-1">
          <TabsTrigger value="members" className="rounded-lg data-[state=active]:bg-brand-navy data-[state=active]:text-white">
            Membros
          </TabsTrigger>
          <TabsTrigger value="teams" className="rounded-lg data-[state=active]:bg-brand-navy data-[state=active]:text-white">
            Squads
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-brand-navy data-[state=active]:text-white">
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* ═══ Members Tab ═══ */}
        <TabsContent value="members" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-lime"
                placeholder="Buscar membro..."
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
              />
            </div>
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button className="bg-brand-navy text-white hover:bg-brand-navy/90 rounded-xl gap-1.5">
                  <UserPlus className="w-4 h-4" />
                  Convidar Membro
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-brand-navy font-display">Convidar Novo Membro</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="inviteEmail">Email</Label>
                    <Input
                      id="inviteEmail"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Função</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="MEMBER">Membro</SelectItem>
                        <SelectItem value="GUEST">Convidado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleInvite}
                    disabled={inviting || !inviteEmail.trim()}
                    className="w-full bg-brand-navy text-white hover:bg-brand-navy/90 rounded-xl"
                  >
                    {inviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Enviar Convite
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-2xl card-shadow border border-slate-100 overflow-hidden">
            {membersLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-sm text-slate-400">
                <Users className="w-8 h-8 mb-2" />
                {memberSearch ? 'Nenhum membro encontrado' : 'Nenhum membro neste workspace'}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Membro</th>
                    <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Função</th>
                    <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Status</th>
                    <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Entrou em</th>
                    <th className={`${cellCls} text-right text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredMembers.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className={`${cellCls} font-medium text-brand-navy`}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-ice-blue flex items-center justify-center">
                            <Users className="w-4 h-4 text-brand-navy" />
                          </div>
                          <span className="font-mono text-xs">{m.userId.slice(0, 8)}...</span>
                        </div>
                      </td>
                      <td className={`${cellCls}`}>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-ice-blue text-brand-navy">
                          {roleLabel(m.role)}
                        </span>
                      </td>
                      <td className={`${cellCls}`}>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          m.status === 'ACTIVE' ? 'bg-green-50 text-green-700' :
                          m.status === 'INVITED' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            m.status === 'ACTIVE' ? 'bg-green-500' :
                            m.status === 'INVITED' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          {statusLabel(m.status)}
                        </span>
                      </td>
                      <td className={`${cellCls} text-slate-400 text-xs`}>
                        {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className={`${cellCls} text-right`}>
                        {m.role !== 'OWNER' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleRemoveMember(m.id)}
                            disabled={removingMember === m.id}
                          >
                            {removingMember === m.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />
                            }
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div className="bg-white rounded-2xl card-shadow border border-slate-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-brand-navy">Convites Pendentes</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Email</th>
                    <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Função</th>
                    <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Status</th>
                    <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Expira em</th>
                    <th className={`${cellCls} text-right text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invitations.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className={`${cellCls} font-medium text-brand-navy`}>{inv.email}</td>
                      <td className={`${cellCls}`}>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-ice-blue text-brand-navy">
                          {roleLabel(inv.role)}
                        </span>
                      </td>
                      <td className={`${cellCls}`}>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          inv.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700' :
                          inv.status === 'ACCEPTED' ? 'bg-green-50 text-green-700' :
                          'bg-slate-50 text-slate-500'
                        }`}>
                          {inv.status === 'PENDING' ? 'Pendente' :
                           inv.status === 'ACCEPTED' ? 'Aceito' :
                           inv.status === 'EXPIRED' ? 'Expirado' : 'Cancelado'}
                        </span>
                      </td>
                      <td className={`${cellCls} text-slate-400 text-xs`}>
                        {new Date(inv.expiresAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className={`${cellCls} text-right`}>
                        {inv.status === 'PENDING' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleCancelInvitation(inv.id)}
                            disabled={cancellingInvite === inv.id}
                          >
                            {cancellingInvite === inv.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />
                            }
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ═══ Teams Tab ═══ */}
        <TabsContent value="teams" className="mt-4 space-y-4">
          <div className="flex items-center justify-end">
            <Dialog open={createTeamOpen} onOpenChange={setCreateTeamOpen}>
              <DialogTrigger asChild>
                <Button className="bg-brand-navy text-white hover:bg-brand-navy/90 rounded-xl gap-1.5">
                  <Plus className="w-4 h-4" />
                  Novo Squad
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-brand-navy font-display">Criar Novo Squad</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="teamName">Nome</Label>
                    <Input
                      id="teamName"
                      placeholder="Ex: Platform, Security, FinOps"
                      value={newTeamName}
                      onChange={e => setNewTeamName(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teamDesc">Descrição</Label>
                    <Input
                      id="teamDesc"
                      placeholder="Descrição do squad"
                      value={newTeamDesc}
                      onChange={e => setNewTeamDesc(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <Button
                    onClick={handleCreateTeam}
                    disabled={creatingTeam || !newTeamName.trim()}
                    className="w-full bg-brand-navy text-white hover:bg-brand-navy/90 rounded-xl"
                  >
                    {creatingTeam ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Criar Squad
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Teams Table */}
          <div className="bg-white rounded-2xl card-shadow border border-slate-100 overflow-hidden">
            {teamsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
              </div>
            ) : teams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-sm text-slate-400">
                <LayoutGrid className="w-8 h-8 mb-2" />
                Nenhum squad configurado
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Squad</th>
                    <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Descrição</th>
                    <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Criado em</th>
                    <th className={`${cellCls} text-right text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {teams.map(team => (
                    <tr key={team.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className={`${cellCls} font-medium text-brand-navy`}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-ice-blue flex items-center justify-center">
                            <LayoutGrid className="w-4 h-4 text-brand-navy" />
                          </div>
                          {team.name}
                        </div>
                      </td>
                      <td className={`${cellCls} text-slate-500`}>{team.description || '-'}</td>
                      <td className={`${cellCls} text-slate-400 text-xs`}>
                        {new Date(team.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className={`${cellCls} text-right`}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-slate-400 hover:text-brand-navy"
                            onClick={() => openEditTeam(team)}
                          >
                            <Pencil className="w-3.5 h-3.5 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteTeam(team.id)}
                            disabled={deletingTeam === team.id}
                          >
                            {deletingTeam === team.id
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

          {/* Edit Team Dialog */}
          <Dialog open={editTeamOpen} onOpenChange={setEditTeamOpen}>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-brand-navy font-display">Editar Squad</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editTeamName">Nome</Label>
                  <Input
                    id="editTeamName"
                    value={editTeamName}
                    onChange={e => setEditTeamName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editTeamDesc">Descrição</Label>
                  <Input
                    id="editTeamDesc"
                    value={editTeamDesc}
                    onChange={e => setEditTeamDesc(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <Button
                  onClick={handleEditTeam}
                  disabled={!editTeamName.trim()}
                  className="w-full bg-brand-navy text-white hover:bg-brand-navy/90 rounded-xl"
                >
                  Salvar Alterações
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══ Settings Tab ═══ */}
        <TabsContent value="settings" className="mt-4">
          <div className="bg-white rounded-2xl card-shadow border border-slate-100 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-brand-navy" />
              <h3 className="text-sm font-bold text-brand-navy">Configurações do Workspace</h3>
            </div>
            <p className="text-sm text-slate-400">
              As configurações avançadas do workspace estarão disponíveis em uma release futura.
            </p>
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
              <Settings className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">Configurações em desenvolvimento</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
