import { useEffect, useState, useCallback } from 'react'
import {
  Shield, ShieldCheck, ShieldOff, Users, Plus, Trash2, UserPlus, Pencil,
  KeyRound, CheckCircle2, XCircle, Loader2, Search, Building2, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { iamApi, type Role, type TenantUser, type Permission, type Tenant } from '@/api/iam'
import { showSuccess, showApiError } from '@/lib/toast'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Use the active tenant from localStorage (set during login/tenant selection)
function getActiveTenantId(): string | null {
  return localStorage.getItem('cloudbuilder-active-tenant-id')
}

export function IAMModule() {
  const [activeTab, setActiveTab] = useState('roles')

  // Roles state
  const [roles, setRoles] = useState<Role[]>([])
  const [rolesLoading, setRolesLoading] = useState(true)
  const [roleSearch, setRoleSearch] = useState('')

  // Users state
  const [users, setUsers] = useState<TenantUser[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [userSearch, setUserSearch] = useState('')

  // Permissions state
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({})
  const [expandedRole, setExpandedRole] = useState<string | null>(null)

  // Tenants state
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [tenantsLoading, setTenantsLoading] = useState(true)

  // Dialogs
  const [createRoleOpen, setCreateRoleOpen] = useState(false)
  const [editRoleOpen, setEditRoleOpen] = useState(false)
  const [editRoleId, setEditRoleId] = useState<string | null>(null)
  const [createUserOpen, setCreateUserOpen] = useState(false)
  const [assignRoleOpen, setAssignRoleOpen] = useState(false)
  const [assignUserId, setAssignUserId] = useState<string | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState('')

  // Permission dialog
  const [permRoleId, setPermRoleId] = useState<string | null>(null)
  const [permAction, setPermAction] = useState('')
  const [permResource, setPermResource] = useState('')
  const [permDialogOpen, setPermDialogOpen] = useState(false)
  const [creatingPerm, setCreatingPerm] = useState(false)

  // Form state
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDesc, setNewRoleDesc] = useState('')
  const [editRoleName, setEditRoleName] = useState('')
  const [editRoleDesc, setEditRoleDesc] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')

  // Loading per-action
  const [creating, setCreating] = useState(false)
  const [deletingRole, setDeletingRole] = useState<string | null>(null)
  const [updatingRole, setUpdatingRole] = useState(false)
  const [togglingUser, setTogglingUser] = useState<string | null>(null)
  const [assigningRole, setAssigningRole] = useState(false)
  const [deletingPerm, setDeletingPerm] = useState<string | null>(null)
  const [togglingTenant, setTogglingTenant] = useState<string | null>(null)

  const tenantId = getActiveTenantId()

  // ─── Data fetching ──────────────────────────────────────────

  const fetchRoles = useCallback(async () => {
    if (!tenantId) return
    setRolesLoading(true)
    try {
      const data = await iamApi.listRoles(tenantId)
      setRoles(Array.isArray(data) ? data : [])
    } catch {
      setRoles([])
    } finally {
      setRolesLoading(false)
    }
  }, [tenantId])

  const fetchUsers = useCallback(async () => {
    if (!tenantId) return
    setUsersLoading(true)
    try {
      const data = await iamApi.listUsersByTenant(tenantId)
      setUsers(Array.isArray(data) ? data : [])
    } catch {
      setUsers([])
    } finally {
      setUsersLoading(false)
    }
  }, [tenantId])

  const fetchTenants = useCallback(async () => {
    setTenantsLoading(true)
    try {
      const data = await iamApi.listTenants()
      setTenants(Array.isArray(data) ? data : [])
    } catch {
      setTenants([])
    } finally {
      setTenantsLoading(false)
    }
  }, [])

  useEffect(() => { fetchRoles() }, [fetchRoles])
  useEffect(() => { fetchUsers() }, [fetchUsers])
  useEffect(() => { fetchTenants() }, [fetchTenants])

  // ─── Permissions ────────────────────────────────────────────

  const togglePermissions = useCallback(async (roleId: string) => {
    if (expandedRole === roleId) {
      setExpandedRole(null)
      return
    }
    setExpandedRole(roleId)
    if (!permissions[roleId]) {
      try {
        const data = await iamApi.listPermissions(roleId)
        setPermissions(prev => ({ ...prev, [roleId]: data }))
      } catch {
        setPermissions(prev => ({ ...prev, [roleId]: [] }))
      }
    }
  }, [expandedRole, permissions])

  // ─── Role CRUD ──────────────────────────────────────────────

  const handleCreateRole = async () => {
    if (!tenantId || !newRoleName.trim()) return
    setCreating(true)
    try {
      await iamApi.createRole({ name: newRoleName.trim(), description: newRoleDesc.trim(), tenantId })
      showSuccess('Role criada com sucesso')
      setCreateRoleOpen(false)
      setNewRoleName('')
      setNewRoleDesc('')
      await fetchRoles()
    } catch (err) {
      showApiError(err, 'Erro ao criar role')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    setDeletingRole(roleId)
    try {
      await iamApi.deleteRole(roleId)
      showSuccess('Role excluída')
      setRoles(prev => prev.filter(r => r.id !== roleId))
    } catch (err) {
      showApiError(err, 'Erro ao excluir role')
    } finally {
      setDeletingRole(null)
    }
  }

  const handleEditRole = async () => {
    if (!editRoleId || !editRoleName.trim()) return
    setUpdatingRole(true)
    try {
      const updated = await iamApi.updateRole(editRoleId, editRoleName.trim(), editRoleDesc.trim())
      setRoles(prev => prev.map(r => r.id === editRoleId ? updated : r))
      showSuccess('Role atualizada com sucesso')
      setEditRoleOpen(false)
      setEditRoleId(null)
    } catch (err) {
      showApiError(err, 'Erro ao atualizar role')
    } finally {
      setUpdatingRole(false)
    }
  }

  const openEditRole = (role: Role) => {
    setEditRoleId(role.id)
    setEditRoleName(role.name)
    setEditRoleDesc(role.description)
    setEditRoleOpen(true)
  }

  // ── Permission CRUD ──

  const handleCreatePermission = async () => {
    if (!permRoleId || !permAction.trim() || !permResource.trim()) return
    setCreatingPerm(true)
    try {
      const perm = await iamApi.createPermission(permRoleId, permAction.trim(), permResource.trim())
      setPermissions(prev => ({
        ...prev,
        [permRoleId]: [...(prev[permRoleId] || []), perm],
      }))
      setPermAction('')
      setPermResource('')
      setPermDialogOpen(false)
      showSuccess('Permissão adicionada')
    } catch (err) {
      showApiError(err, 'Erro ao adicionar permissão')
    } finally {
      setCreatingPerm(false)
    }
  }

  const handleDeletePermission = async (permId: string, roleId: string) => {
    setDeletingPerm(permId)
    try {
      await iamApi.deletePermission(permId)
      setPermissions(prev => ({
        ...prev,
        [roleId]: (prev[roleId] || []).filter(p => p.id !== permId),
      }))
      showSuccess('Permissão removida')
    } catch (err) {
      showApiError(err, 'Erro ao remover permissão')
    } finally {
      setDeletingPerm(null)
    }
  }

  // ─── User actions ───────────────────────────────────────────

  const handleCreateUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) return
    setCreating(true)
    try {
      await iamApi.createUser({ name: newUserName.trim(), email: newUserEmail.trim(), passwordHash: newUserPassword.trim() })
      showSuccess('Usuário criado com sucesso')
      setCreateUserOpen(false)
      setNewUserName('')
      setNewUserEmail('')
      setNewUserPassword('')
      await fetchUsers()
    } catch (err) {
      showApiError(err, 'Erro ao criar usuário')
    } finally {
      setCreating(false)
    }
  }

  const handleToggleUser = async (userId: string, currentEnabled: boolean) => {
    setTogglingUser(userId)
    try {
      if (currentEnabled) {
        await iamApi.disableUser(userId)
        showSuccess('Usuário desabilitado')
      } else {
        await iamApi.enableUser(userId)
        showSuccess('Usuário habilitado')
      }
      await fetchUsers()
    } catch (err) {
      showApiError(err, 'Erro ao alterar status do usuário')
    } finally {
      setTogglingUser(null)
    }
  }

  const handleToggleTenant = async (tenantId: string, currentActive: boolean) => {
    setTogglingTenant(tenantId)
    try {
      if (currentActive) {
        await iamApi.deactivateTenant(tenantId)
        showSuccess('Tenant desativado')
      } else {
        await iamApi.activateTenant(tenantId)
        showSuccess('Tenant ativado')
      }
      setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, active: !currentActive } : t))
    } catch (err) {
      showApiError(err, 'Erro ao alterar status do tenant')
    } finally {
      setTogglingTenant(null)
    }
  }

  const handleAssignRole = async () => {
    if (!tenantId || !assignUserId || !selectedRoleId) return
    setAssigningRole(true)
    try {
      await iamApi.assignRole(tenantId, assignUserId, selectedRoleId)
      showSuccess('Role atribuída com sucesso')
      setAssignRoleOpen(false)
      setAssignUserId(null)
      setSelectedRoleId('')
      await fetchUsers()
    } catch (err) {
      showApiError(err, 'Erro ao atribuir role')
    } finally {
      setAssigningRole(false)
    }
  }

  // ─── Filters ────────────────────────────────────────────────

  const filteredRoles = roles.filter(r =>
    r.name.toLowerCase().includes(roleSearch.toLowerCase())
  )

  const filteredUsers = users.filter(u =>
    u.userName.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.userEmail.toLowerCase().includes(userSearch.toLowerCase())
  )

  // ─── Stats ──────────────────────────────────────────────────

  const totalPermissions = roles.reduce((acc, r) => acc + (expandedRole === r.id && permissions[r.id] ? permissions[r.id].length : 0), 0)

  // ─── Common cell styles ─────────────────────────────────────

  const cellCls = 'px-4 py-3 text-sm'

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy font-display">IAM</h1>
          <p className="text-sm text-slate-400">Gerenciamento de identidade e acesso</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 card-shadow border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-ice-blue p-3">
              <Shield className="h-5 w-5 text-brand-navy" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Roles</p>
              <p className="text-2xl font-bold text-brand-navy">{roles.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 card-shadow border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-ice-blue p-3">
              <Users className="h-5 w-5 text-brand-navy" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Usuários</p>
              <p className="text-2xl font-bold text-brand-navy">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 card-shadow border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-ice-blue p-3">
              <KeyRound className="h-5 w-5 text-brand-navy" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Permissões</p>
              <p className="text-2xl font-bold text-brand-navy">{totalPermissions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border border-slate-200 rounded-xl p-1">
          <TabsTrigger value="roles" className="rounded-lg data-[state=active]:bg-brand-navy data-[state=active]:text-white">
            Roles
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-brand-navy data-[state=active]:text-white">
            Usuários
          </TabsTrigger>
          <TabsTrigger value="tenants" className="rounded-lg data-[state=active]:bg-brand-navy data-[state=active]:text-white">
            Tenants
          </TabsTrigger>
        </TabsList>

        {/* ═══ Roles Tab ═══ */}
        <TabsContent value="roles" className="mt-4 space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-lime"
                placeholder="Buscar role..."
                value={roleSearch}
                onChange={e => setRoleSearch(e.target.value)}
              />
            </div>
            <Dialog open={createRoleOpen} onOpenChange={setCreateRoleOpen}>
              <DialogTrigger asChild>
                <Button className="bg-brand-navy text-white hover:bg-brand-navy/90 rounded-xl gap-1.5">
                  <Plus className="w-4 h-4" />
                  Nova Role
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-brand-navy font-display">Criar Nova Role</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="roleName">Nome da Role</Label>
                    <Input
                      id="roleName"
                      placeholder="Ex: devops, security-auditor"
                      value={newRoleName}
                      onChange={e => setNewRoleName(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roleDesc">Descrição</Label>
                    <Input
                      id="roleDesc"
                      placeholder="Descrição da role"
                      value={newRoleDesc}
                      onChange={e => setNewRoleDesc(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <Button
                    onClick={handleCreateRole}
                    disabled={creating || !newRoleName.trim()}
                    className="w-full bg-brand-navy text-white hover:bg-brand-navy/90 rounded-xl"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Criar Role
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Roles Table */}
          <div className="bg-white rounded-2xl card-shadow border border-slate-100 overflow-hidden">
            {rolesLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-sm text-slate-400">
                <ShieldOff className="w-8 h-8 mb-2" />
                {roleSearch ? 'Nenhuma role encontrada para essa busca' : 'Nenhuma role configurada'}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Role</th>
                    <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Descrição</th>
                    <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Criada em</th>
                    <th className={`${cellCls} text-right text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredRoles.map(role => (
                    <tr key={role.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className={`${cellCls} font-medium text-brand-navy`}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-ice-blue flex items-center justify-center">
                            <ShieldCheck className="w-4 h-4 text-brand-navy" />
                          </div>
                          {role.name}
                        </div>
                      </td>
                      <td className={`${cellCls} text-slate-500`}>{role.description || '-'}</td>
                      <td className={`${cellCls} text-slate-400 text-xs`}>
                        {new Date(role.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className={`${cellCls} text-right`}>
                        <div className="flex items-center justify-end gap-1">
                                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-slate-400 hover:text-brand-navy"
                            onClick={() => openEditRole(role)}
                          >
                            <Pencil className="w-3.5 h-3.5 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-slate-400 hover:text-brand-navy"
                            onClick={() => togglePermissions(role.id)}
                          >
                            <KeyRound className="w-3.5 h-3.5 mr-1" />
                            {expandedRole === role.id ? 'Fechar' : 'Permissões'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteRole(role.id)}
                            disabled={deletingRole === role.id}
                          >
                            {deletingRole === role.id
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

          {/* Expanded Permissions */}
          {expandedRole && (
            <div className="bg-ice-blue/30 rounded-2xl p-4 border border-ice-blue/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-brand-navy" />
                  <span className="text-sm font-bold text-brand-navy">
                    Permissões: {roles.find(r => r.id === expandedRole)?.name}
                  </span>
                </div>
                <Dialog open={permDialogOpen && permRoleId === expandedRole} onOpenChange={open => {
                  setPermDialogOpen(open)
                  if (!open) setPermRoleId(null)
                }}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-brand-navy hover:text-brand-navy/80"
                      onClick={() => {
                        setPermRoleId(expandedRole)
                        setPermDialogOpen(true)
                      }}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Adicionar Permissão
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-brand-navy font-display">Nova Permissão</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="permAction">Ação</Label>
                        <Input
                          id="permAction"
                          placeholder="Ex: CREATE, READ, UPDATE, DELETE"
                          value={permAction}
                          onChange={e => setPermAction(e.target.value)}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="permResource">Recurso</Label>
                        <Input
                          id="permResource"
                          placeholder="Ex: CANVAS, PROVISION, COST"
                          value={permResource}
                          onChange={e => setPermResource(e.target.value)}
                          className="rounded-xl"
                        />
                      </div>
                      <Button
                        onClick={handleCreatePermission}
                        disabled={creatingPerm || !permAction.trim() || !permResource.trim()}
                        className="w-full bg-brand-navy text-white hover:bg-brand-navy/90 rounded-xl"
                      >
                        {creatingPerm ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Adicionar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {!permissions[expandedRole] ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-brand-navy" />
                </div>
              ) : permissions[expandedRole].length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Nenhuma permissão configurada para esta role</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {permissions[expandedRole].map(p => (
                    <span key={p.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-xs font-medium text-brand-navy border border-ice-blue group">
                      <CheckCircle2 className="w-3 h-3" />
                      {p.action}:{p.resource}
                      <button
                        className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"
                        onClick={() => handleDeletePermission(p.id, expandedRole)}
                        disabled={deletingPerm === p.id}
                      >
                        {deletingPerm === p.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <XCircle className="w-3 h-3" />
                        }
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Edit Role Dialog */}
          <Dialog open={editRoleOpen} onOpenChange={setEditRoleOpen}>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-brand-navy font-display">Editar Role</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editRoleName">Nome da Role</Label>
                  <Input
                    id="editRoleName"
                    value={editRoleName}
                    onChange={e => setEditRoleName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editRoleDesc">Descrição</Label>
                  <Input
                    id="editRoleDesc"
                    value={editRoleDesc}
                    onChange={e => setEditRoleDesc(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <Button
                  onClick={handleEditRole}
                  disabled={updatingRole || !editRoleName.trim()}
                  className="w-full bg-brand-navy text-white hover:bg-brand-navy/90 rounded-xl"
                >
                  {updatingRole ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Salvar Alterações
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══ Users Tab ═══ */}
        <TabsContent value="users" className="mt-4 space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-lime"
                placeholder="Buscar usuário..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
              />
            </div>
            <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
              <DialogTrigger asChild>
                <Button className="bg-brand-navy text-white hover:bg-brand-navy/90 rounded-xl gap-1.5">
                  <UserPlus className="w-4 h-4" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-brand-navy font-display">Criar Novo Usuário</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="userName">Nome</Label>
                    <Input
                      id="userName"
                      placeholder="Nome completo"
                      value={newUserName}
                      onChange={e => setNewUserName(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userEmail">Email</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={newUserEmail}
                      onChange={e => setNewUserEmail(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userPassword">Senha</Label>
                    <Input
                      id="userPassword"
                      type="password"
                      placeholder="Senha temporária"
                      value={newUserPassword}
                      onChange={e => setNewUserPassword(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <Button
                    onClick={handleCreateUser}
                    disabled={creating || !newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()}
                    className="w-full bg-brand-navy text-white hover:bg-brand-navy/90 rounded-xl"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Criar Usuário
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl card-shadow border border-slate-100 overflow-hidden">
            {usersLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-sm text-slate-400">
                <Users className="w-8 h-8 mb-2" />
                {userSearch ? 'Nenhum usuário encontrado para essa busca' : 'Nenhum usuário neste tenant'}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Usuário</th>
                    <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Email</th>
                    <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Role</th>
                    <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Status</th>
                    <th className={`${cellCls} text-right text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map(tu => (
                    <tr key={tu.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className={`${cellCls} font-medium text-brand-navy`}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-ice-blue flex items-center justify-center">
                            <Users className="w-4 h-4 text-brand-navy" />
                          </div>
                          {tu.userName}
                        </div>
                      </td>
                      <td className={`${cellCls} text-slate-500`}>{tu.userEmail}</td>
                      <td className={`${cellCls}`}>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-ice-blue text-brand-navy">
                          {tu.roleName}
                        </span>
                      </td>
                      <td className={`${cellCls}`}>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          true // TenantUser doesn't have enabled field, assume active
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            true ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          Ativo
                        </span>
                      </td>
                      <td className={`${cellCls} text-right`}>
                        <div className="flex items-center justify-end gap-1">
                          <Dialog open={assignRoleOpen && assignUserId === tu.userId} onOpenChange={open => {
                            setAssignRoleOpen(open)
                            if (!open) setAssignUserId(null)
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-slate-400 hover:text-brand-navy"
                                onClick={() => {
                                  setAssignUserId(tu.userId)
                                  setAssignRoleOpen(true)
                                }}
                              >
                                <Shield className="w-3.5 h-3.5 mr-1" />
                                Atribuir Role
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-2xl">
                              <DialogHeader>
                                <DialogTitle className="text-brand-navy font-display">
                                  Atribuir Role para {tu.userName}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Selecionar Role</Label>
                                  <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                                    <SelectTrigger className="rounded-xl">
                                      <SelectValue placeholder="Escolha uma role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {roles.map(r => (
                                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  onClick={handleAssignRole}
                                  disabled={assigningRole || !selectedRoleId}
                                  className="w-full bg-brand-navy text-white hover:bg-brand-navy/90 rounded-xl"
                                >
                                  {assigningRole ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                  Atribuir
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        {/* ═══ Tenants Tab ═══ */}
        <TabsContent value="tenants" className="mt-4 space-y-4">
          <div className="bg-white rounded-2xl card-shadow border border-slate-100 overflow-hidden">
            {tenantsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
              </div>
            ) : tenants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-sm text-slate-400">
                <Building2 className="w-8 h-8 mb-2" />
                Nenhum tenant encontrado
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Tenant</th>
                    <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Slug</th>
                    <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Criado em</th>
                    <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Status</th>
                    <th className={`${cellCls} text-right text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tenants.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className={`${cellCls} font-medium text-brand-navy`}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-ice-blue flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-brand-navy" />
                          </div>
                          {t.name}
                        </div>
                      </td>
                      <td className={`${cellCls} text-slate-500 font-mono text-xs`}>{t.slug}</td>
                      <td className={`${cellCls} text-slate-400 text-xs`}>
                        {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className={`${cellCls}`}>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          t.active
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${t.active ? 'bg-green-500' : 'bg-red-500'}`} />
                          {t.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className={`${cellCls} text-right`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`text-xs ${
                            t.active
                              ? 'text-red-400 hover:text-red-600 hover:bg-red-50'
                              : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                          }`}
                          onClick={() => handleToggleTenant(t.id, t.active)}
                          disabled={togglingTenant === t.id}
                        >
                          {togglingTenant === t.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                            : t.active
                              ? <ToggleRight className="w-3.5 h-3.5 mr-1" />
                              : <ToggleLeft className="w-3.5 h-3.5 mr-1" />
                          }
                          {t.active ? 'Desativar' : 'Ativar'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
