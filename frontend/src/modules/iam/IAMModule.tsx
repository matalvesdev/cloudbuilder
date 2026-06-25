import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Shield, ShieldCheck, ShieldOff, Users, Plus, Trash2, UserPlus, Pencil,
  KeyRound, CheckCircle2, XCircle, Loader2, Search, Building2, ToggleLeft, ToggleRight,
  Smartphone, LogOut, Globe, Monitor, Clock, AlertTriangle, CheckCircle,
  LayoutGrid, MoreHorizontal, Eye, EyeOff, ChevronDown, ChevronRight, Copy,
} from 'lucide-react'
import { iamApi, type Role, type TenantUser, type Permission, type Tenant, type MfaConfig, type UserSession, type PermissionMatrixEntry } from '@/api/iam'
import { showSuccess, showApiError } from '@/lib/toast'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

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

  // MFA state
  const [mfaConfigs, setMfaConfigs] = useState<Record<string, MfaConfig>>({})
  const [mfaDialogOpen, setMfaDialogOpen] = useState(false)
  const [mfaUserId, setMfaUserId] = useState<string | null>(null)
  const [mfaLoading, setMfaLoading] = useState(false)
  const [mfaSetupData, setMfaSetupData] = useState<{ qrCode: string; secretKey: string } | null>(null)
  const [mfaVerifyCode, setMfaVerifyCode] = useState('')
  const [mfaVerifying, setMfaVerifying] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)
  const [backupCodesCopied, setBackupCodesCopied] = useState(false)

  // Sessions state
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionsUserId, setSessionsUserId] = useState<string | null>(null)
  const [sessionsDialogOpen, setSessionsDialogOpen] = useState(false)
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null)
  const [revokingAll, setRevokingAll] = useState(false)

  // Permission Matrix state
  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrixEntry[]>([])
  const [matrixLoading, setMatrixLoading] = useState(false)
  const [matrixExpandedRole, setMatrixExpandedRole] = useState<string | null>(null)

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

  // ─── MFA Handlers ───────────────────────────────────────────

  const handleSetupMfa = async (userId: string) => {
    setMfaLoading(true)
    try {
      const data = await iamApi.setupMfa(userId)
      setMfaSetupData({ qrCode: data.qrCode, secretKey: data.secretKey })
      setMfaConfigs(prev => ({ ...prev, [userId]: data.config }))
      showSuccess('MFA configurado. Escaneie o QR Code com seu aplicativo autenticador.')
    } catch (err) {
      showApiError(err, 'Erro ao configurar MFA')
    } finally {
      setMfaLoading(false)
    }
  }

  const generateBackupCodes = useCallback((): string[] => {
    const codes: string[] = []
    for (let i = 0; i < 8; i++) {
      const segment1 = Math.random().toString(36).substring(2, 6).toUpperCase()
      const segment2 = Math.random().toString(36).substring(2, 6).toUpperCase()
      codes.push(`${segment1}-${segment2}`)
    }
    return codes
  }, [])

  const handleVerifyMfa = async () => {
    if (!mfaUserId || !mfaVerifyCode.trim()) return
    setMfaVerifying(true)
    try {
      const config = await iamApi.verifyMfa(mfaUserId, mfaVerifyCode.trim())
      setMfaConfigs(prev => ({ ...prev, [mfaUserId]: config }))
      // Generate backup codes after successful verification
      const codes = generateBackupCodes()
      setBackupCodes(codes)
      setMfaSetupData(null)
      setMfaVerifyCode('')
      showSuccess('MFA verificado e ativado com sucesso! Guarde seus códigos de recuperação.')
    } catch (err) {
      showApiError(err, 'Código MFA inválido')
    } finally {
      setMfaVerifying(false)
    }
  }

  const handleDisableMfa = async (userId: string) => {
    setMfaLoading(true)
    try {
      await iamApi.disableMfa(userId)
      const currentConfig = mfaConfigs[userId]
      if (currentConfig) {
        setMfaConfigs(prev => ({ ...prev, [userId]: { ...currentConfig, enabled: false, verified: false } }))
      }
      showSuccess('MFA desativado')
    } catch (err) {
      showApiError(err, 'Erro ao desativar MFA')
    } finally {
      setMfaLoading(false)
    }
  }

  const openMfaDialog = async (userId: string) => {
    setMfaUserId(userId)
    setMfaDialogOpen(true)
    setMfaSetupData(null)
    setMfaVerifyCode('')
    setMfaLoading(true)
    try {
      const config = await iamApi.getMfaConfig(userId)
      setMfaConfigs(prev => ({ ...prev, [userId]: config }))
    } catch {
      // User may not have MFA config yet
    } finally {
      setMfaLoading(false)
    }
  }

  // ─── Session Handlers ───────────────────────────────────────

  const openSessionsDialog = async (userId: string) => {
    setSessionsUserId(userId)
    setSessionsDialogOpen(true)
    setSessionsLoading(true)
    try {
      const data = await iamApi.listSessions(userId)
      setSessions(data)
    } catch {
      setSessions([])
    } finally {
      setSessionsLoading(false)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    if (!sessionsUserId) return
    setRevokingSessionId(sessionId)
    try {
      await iamApi.revokeSession(sessionsUserId, sessionId)
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'revoked' } : s))
      showSuccess('Sessão revogada')
    } catch (err) {
      showApiError(err, 'Erro ao revogar sessão')
    } finally {
      setRevokingSessionId(null)
    }
  }

  const handleRevokeAllSessions = async () => {
    if (!sessionsUserId) return
    setRevokingAll(true)
    try {
      await iamApi.revokeAllSessions(sessionsUserId)
      setSessions(prev => prev.map(s => ({ ...s, status: 'revoked' as const })))
      showSuccess('Todas as sessões foram revogadas')
    } catch (err) {
      showApiError(err, 'Erro ao revogar sessões')
    } finally {
      setRevokingAll(false)
    }
  }

  // ─── Permission Matrix Handler ──────────────────────────────

  const fetchPermissionMatrix = useCallback(async () => {
    if (!tenantId) return
    setMatrixLoading(true)
    try {
      const data = await iamApi.getPermissionMatrix(tenantId)
      setPermissionMatrix(Array.isArray(data) ? data : [])
    } catch {
      setPermissionMatrix([])
    } finally {
      setMatrixLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    if (activeTab === 'permissions') {
      fetchPermissionMatrix()
    }
  }, [activeTab, fetchPermissionMatrix])

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
          <TabsTrigger value="permissions" className="rounded-lg data-[state=active]:bg-brand-navy data-[state=active]:text-white">
            Permissões
          </TabsTrigger>
          <TabsTrigger value="sessions" className="rounded-lg data-[state=active]:bg-brand-navy data-[state=active]:text-white">
            Sessões
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

        {/* ═══ Permissions Tab (Permission Matrix) ═══ */}
        <TabsContent value="permissions" className="mt-4 space-y-4">
          <div className="bg-white rounded-2xl card-shadow border border-slate-100 overflow-hidden">
            {matrixLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
              </div>
            ) : permissionMatrix.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-sm text-slate-400">
                <LayoutGrid className="w-8 h-8 mb-2" />
                {tenantId ? 'Nenhuma permissão encontrada. Atribua permissões às roles primeiro.' : 'Selecione um tenant para ver a matriz de permissões.'}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {permissionMatrix.map((entry) => {
                  const isExpanded = matrixExpandedRole === entry.roleId
                  return (
                    <div key={entry.roleId}>
                      <button
                        onClick={() => setMatrixExpandedRole(isExpanded ? null : entry.roleId)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-ice-blue flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-brand-navy" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-brand-navy">{entry.roleName}</p>
                            <p className="text-xs text-slate-400">{entry.permissions.length} permissão(ões)</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-wrap gap-1 max-w-[300px]">
                            {entry.permissions.slice(0, 4).map((p) => (
                              <span key={p.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-ice-blue/50 text-[9px] font-medium text-brand-navy border border-ice-blue">
                                {p.action}:{p.resource}
                              </span>
                            ))}
                            {entry.permissions.length > 4 && (
                              <span className="text-[9px] text-slate-400 px-1">+{entry.permissions.length - 4}</span>
                            )}
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400 ml-2" />
                          )}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="px-5 pb-4 border-t border-slate-50">
                          <div className="mt-3">
                            <div className="grid grid-cols-4 gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide px-3 pb-2 border-b border-slate-100 mb-2">
                              <span>Ação</span>
                              <span>Recurso</span>
                              <span>Descrição</span>
                              <span className="text-center">Status</span>
                            </div>
                            {entry.permissions.map((p) => (
                              <div key={p.id} className="grid grid-cols-4 gap-2 py-2 px-3 text-xs text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                                <span className="font-mono font-medium text-brand-navy">{p.action}</span>
                                <span className="font-mono">{p.resource}</span>
                                <span className="text-slate-400">{p.description || '-'}</span>
                                <span className="flex justify-center">
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ═══ Sessions Tab ═══ */}
        <TabsContent value="sessions" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Gerencie sessões ativas dos usuários no sistema</p>
          </div>
          <div className="bg-white rounded-2xl card-shadow border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-lime"
                    placeholder="Buscar por usuário..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>
            {usersLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-sm text-slate-400">
                <Users className="w-8 h-8 mb-2" />
                Nenhum usuário encontrado
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Usuário</th>
                    <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Sessões</th>
                    <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>MFA</th>
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
                          <div>
                            <p className="text-sm font-medium text-brand-navy">{tu.userName}</p>
                            <p className="text-[10px] text-slate-400">{tu.userEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className={cellCls}>
                        <span className="text-xs text-slate-500">Gerenciar</span>
                      </td>
                      <td className={cellCls}>
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border',
                          mfaConfigs[tu.userId]?.enabled && mfaConfigs[tu.userId]?.verified
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        )}>
                          <Smartphone className="w-3 h-3" />
                          {mfaConfigs[tu.userId]?.enabled && mfaConfigs[tu.userId]?.verified ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className={`${cellCls} text-right`}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-slate-400 hover:text-brand-navy"
                            onClick={() => openMfaDialog(tu.userId)}
                          >
                            <Smartphone className="w-3.5 h-3.5 mr-1" />
                            MFA
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-slate-400 hover:text-brand-navy"
                            onClick={() => openSessionsDialog(tu.userId)}
                          >
                            <Monitor className="w-3.5 h-3.5 mr-1" />
                            Sessões
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ═══ MFA Dialog ═══ */}
      <Dialog open={mfaDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setBackupCodes(null)
          setBackupCodesCopied(false)
        }
        setMfaDialogOpen(open)
      }}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-brand-navy font-display flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Configuração MFA
            </DialogTitle>
          </DialogHeader>
          {backupCodes ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-brand-lime/20 flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-brand-navy" />
                </div>
                <p className="text-sm font-bold text-brand-navy">MFA ativado com sucesso!</p>
                <p className="text-xs text-slate-400 mt-1">Guarde estes códigos de recuperação em local seguro.</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <p className="text-xs font-bold text-amber-800">Códigos de Recuperação</p>
                </div>
                <p className="text-[10px] text-amber-700 mb-3">
                  Cada código só pode ser usado uma vez. Armazene-os em um gerenciador de senhas.
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {backupCodes.map((code, i) => (
                    <code key={i} className="font-mono text-xs bg-white px-2 py-1.5 rounded border border-amber-200 text-amber-900 text-center tracking-wide">
                      {code}
                    </code>
                  ))}
                </div>
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs border-amber-300 text-amber-800 hover:bg-amber-100 rounded-lg"
                    onClick={() => {
                      navigator.clipboard.writeText(backupCodes.join('\n'))
                      setBackupCodesCopied(true)
                      showSuccess('Códigos copiados para a área de transferência!')
                      setTimeout(() => setBackupCodesCopied(false), 2000)
                    }}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    {backupCodesCopied ? 'Copiado!' : 'Copiar todos os códigos'}
                  </Button>
                </div>
              </div>
              <Button
                className="w-full bg-brand-navy text-white hover:bg-brand-navy/90 rounded-xl"
                onClick={() => {
                  setBackupCodes(null)
                  setMfaDialogOpen(false)
                }}
              >
                Concluir
              </Button>
            </div>
          ) : mfaLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
            </div>
          ) : mfaSetupData ? (
            <div className="space-y-4">
              {mfaSetupData.qrCode && (
                <div className="text-center">
                  <img src={mfaSetupData.qrCode} alt="QR Code MFA" className="w-48 h-48 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Escaneie o QR Code com seu aplicativo autenticador</p>
                </div>
              )}
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Chave Secreta</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200 flex-1 break-all">
                    {mfaSetupData.secretKey}
                  </code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(mfaSetupData.secretKey); showSuccess('Chave copiada!') }}
                    className="p-1.5 rounded-lg hover:bg-white transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mfaCode">Código de Verificação</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="mfaCode"
                    placeholder="000000"
                    maxLength={6}
                    value={mfaVerifyCode}
                    onChange={e => setMfaVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="rounded-xl font-mono text-lg text-center tracking-[0.5em]"
                  />
                  <Button
                    onClick={handleVerifyMfa}
                    disabled={mfaVerifying || mfaVerifyCode.length < 6}
                    className="bg-brand-navy text-white hover:bg-brand-navy/90 rounded-xl"
                  >
                    {mfaVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Verificar
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {mfaUserId && mfaConfigs[mfaUserId]?.enabled ? (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-brand-navy">MFA está ativo</p>
                  <p className="text-xs text-slate-400">O usuário utiliza autenticação de dois fatores via {mfaConfigs[mfaUserId]?.method === 'totp' ? 'aplicativo autenticador' : mfaConfigs[mfaUserId]?.method}</p>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
                    onClick={() => handleDisableMfa(mfaUserId!)}
                    disabled={mfaLoading}
                  >
                    {mfaLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldOff className="w-4 h-4 mr-2" />}
                    Desativar MFA
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-ice-blue flex items-center justify-center mx-auto">
                    <Smartphone className="w-6 h-6 text-brand-navy" />
                  </div>
                  <p className="text-sm font-medium text-brand-navy">MFA não configurado</p>
                  <p className="text-xs text-slate-400">Configure a autenticação de dois fatores para aumentar a segurança da conta.</p>
                  <Button
                    className="bg-brand-navy text-white hover:bg-brand-navy/90 rounded-xl"
                    onClick={() => mfaUserId && handleSetupMfa(mfaUserId)}
                    disabled={mfaLoading}
                  >
                    {mfaLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Smartphone className="w-4 h-4 mr-2" />}
                    Configurar MFA
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Sessions Dialog ═══ */}
      <Dialog open={sessionsDialogOpen} onOpenChange={setSessionsDialogOpen}>
        <DialogContent className="rounded-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-brand-navy font-display flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Sessões Ativas
            </DialogTitle>
          </DialogHeader>
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-sm text-slate-400">
              <Monitor className="w-8 h-8 mb-2" />
              Nenhuma sessão encontrada
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">{sessions.filter(s => s.status === 'active').length} sessão(ões) ativa(s)</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-red-600 border-red-200 hover:bg-red-50 rounded-lg"
                  onClick={handleRevokeAllSessions}
                  disabled={revokingAll}
                >
                  {revokingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <LogOut className="w-3.5 h-3.5 mr-1" />}
                  Revogar Todas
                </Button>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {sessions.map((session) => (
                  <div key={session.id} className={cn(
                    'flex items-start gap-3 p-3 rounded-xl border transition-colors',
                    session.status === 'active' ? 'bg-white border-slate-200' :
                    session.status === 'revoked' ? 'bg-red-50/30 border-red-200' :
                    'bg-slate-50 border-slate-200'
                  )}>
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                      session.status === 'active' ? 'bg-green-50' :
                      session.status === 'revoked' ? 'bg-red-50' : 'bg-slate-100'
                    )}>
                      <Monitor className={cn(
                        'w-4 h-4',
                        session.status === 'active' ? 'text-green-600' :
                        session.status === 'revoked' ? 'text-red-500' : 'text-slate-400'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-brand-navy">{session.deviceName || 'Dispositivo desconhecido'}</span>
                        {session.isCurrent && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-lime/30 text-brand-navy font-bold">Atual</span>
                        )}
                        <span className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded-full border font-medium',
                          session.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                          session.status === 'revoked' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        )}>
                          {session.status === 'active' ? 'Ativa' : session.status === 'revoked' ? 'Revogada' : 'Expirada'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <Globe className="w-3 h-3" />
                        <span>{session.ipAddress}</span>
                        {session.location && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span>{session.location}</span>
                          </>
                        )}
                        <span className="text-slate-300">·</span>
                        <Clock className="w-3 h-3" />
                        <span>{new Date(session.lastActivity).toLocaleString('pt-BR')}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5 truncate max-w-md">{session.userAgent}</p>
                    </div>
                    <div className="shrink-0">
                      {session.status === 'active' && !session.isCurrent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                          onClick={() => handleRevokeSession(session.id)}
                          disabled={revokingSessionId === session.id}
                        >
                          {revokingSessionId === session.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <LogOut className="w-3.5 h-3.5" />
                          )}
                          Revogar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
