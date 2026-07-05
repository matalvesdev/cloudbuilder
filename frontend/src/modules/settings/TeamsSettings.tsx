import { useState, useMemo, useEffect } from 'react'
import {
  Users, Plus, Trash2, Search, Edit3, X, Loader2, ChevronRight,
  Shield, UserPlus, UserMinus, FolderKanban, Crown, Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTeamStore } from '@/store/teamStore'
import { useAuthStore } from '@/store/authStore'
import type { Team, Squad } from '@/api/teams'

// ─── Create/Edit Team Dialog ──────────────────────────────────────

function TeamDialog({ open, onClose, editTeam }: {
  open: boolean
  onClose: () => void
  editTeam: Team | null
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const { createTeamAction, updateTeamAction, loadTeams } = useTeamStore()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (open) {
      setName(editTeam?.name || '')
      setDescription(editTeam?.description || '')
    }
  }, [open, editTeam])

  if (!open) return null

  const orgId = user?.tenantId || ''

  const handleSubmit = async () => {
    if (!name.trim() || !orgId) return
    setSaving(true)
    if (editTeam) {
      await updateTeamAction(orgId, editTeam.id, name.trim(), description.trim())
    } else {
      await createTeamAction(orgId, name.trim(), description.trim())
    }
    await loadTeams(orgId)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-brand-navy font-display">
            {editTeam ? 'Editar Time' : 'Novo Time'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {editTeam ? 'Atualize as informações do time' : 'Crie um novo time para organizar membros'}
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy bg-white transition-all"
              placeholder="Ex: Plataforma, Backend, Frontend"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-20 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy bg-white transition-all resize-none"
              placeholder="Descrição opcional do time"
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
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
            className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {editTeam ? 'Salvar' : 'Criar Time'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Create/Edit Squad Dialog ─────────────────────────────────────

function SquadDialog({ open, onClose, editSquad, workspaceId }: {
  open: boolean
  onClose: () => void
  editSquad: Squad | null
  workspaceId: string
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const { createSquadAction, updateSquadAction, loadSquads } = useTeamStore()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (open) {
      setName(editSquad?.name || '')
      setDescription(editSquad?.description || '')
    }
  }, [open, editSquad])

  if (!open) return null

  const orgId = user?.tenantId || ''

  const handleSubmit = async () => {
    if (!name.trim() || !orgId) return
    setSaving(true)
    if (editSquad) {
      await updateSquadAction(orgId, editSquad.id, name.trim(), description.trim())
    } else {
      await createSquadAction(orgId, workspaceId || 'default', name.trim(), description.trim())
    }
    await loadSquads(orgId, workspaceId)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-brand-navy font-display">
            {editSquad ? 'Editar Squad' : 'Novo Squad'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {editSquad ? 'Atualize as informações do squad' : 'Crie um squad dentro do workspace'}
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy bg-white transition-all"
              placeholder="Ex: Squad Alpha, Squad Infra"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-20 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy bg-white transition-all resize-none"
              placeholder="Descrição opcional do squad"
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
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
            className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {editSquad ? 'Salvar' : 'Criar Squad'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────

export function TeamsSettings() {
  const {
    teams, squads, members, selectedTeamId, loading, error,
    loadTeams, loadSquads, loadMembersByTeam,
    deleteTeamAction, deleteSquadAction,
    selectTeam, clearError,
  } = useTeamStore()
  const user = useAuthStore((s) => s.user)

  const [searchTerm, setSearchTerm] = useState('')
  const [showTeamDialog, setShowTeamDialog] = useState(false)
  const [editTeam, setEditTeam] = useState<Team | null>(null)
  const [showSquadDialog, setShowSquadDialog] = useState(false)
  const [editSquad, setEditSquad] = useState<Squad | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'team' | 'squad'; id: string; name: string } | null>(null)

  const orgId = user?.tenantId || ''

  useEffect(() => {
    if (orgId) loadTeams(orgId)
  }, [orgId])

  useEffect(() => {
    if (selectedTeamId && orgId) {
      loadMembersByTeam(orgId, selectedTeamId)
    }
  }, [selectedTeamId, orgId])

  const selectedTeam = useMemo(
    () => teams.find((t) => t.id === selectedTeamId) || null,
    [teams, selectedTeamId]
  )

  const filteredTeams = useMemo(
    () => teams.filter((t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [teams, searchTerm]
  )

  const handleSelectTeam = (team: Team) => {
    selectTeam(team.id === selectedTeamId ? null : team.id)
    setSearchTerm('')
  }

  const handleDelete = async () => {
    if (!deleteConfirm || !orgId) return
    if (deleteConfirm.type === 'team') {
      await deleteTeamAction(orgId, deleteConfirm.id)
    } else {
      await deleteSquadAction(orgId, deleteConfirm.id)
    }
    setDeleteConfirm(null)
  }

  if (!orgId) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-semibold text-brand-navy">Selecione uma organização</p>
        <p className="text-xs text-slate-400 mt-1">Faça login para gerenciar times e squads</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-ice-blue flex items-center justify-center">
            <Users className="w-4 h-4 text-brand-navy" />
          </div>
          <div>
            <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-400">Times & Squads</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Organize membros em times e squads</p>
          </div>
        </div>
        <button
          onClick={() => { setEditTeam(null); setShowTeamDialog(true) }}
          className="inline-flex items-center gap-1.5 px-4 h-8 rounded-full text-[11px] font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Novo Time
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
          <X className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={clearError} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Loading */}
      {loading && teams.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-brand-navy animate-spin" />
        </div>
      )}

      {/* Content */}
      {!loading && teams.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-ice-blue flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-brand-navy" />
          </div>
          <p className="text-sm font-semibold text-brand-navy mb-1">Nenhum time criado</p>
          <p className="text-xs text-slate-400 mb-4 max-w-sm">
            Crie times para organizar membros da organização e atribuir responsabilidades.
          </p>
          <button
            onClick={() => { setEditTeam(null); setShowTeamDialog(true) }}
            className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all"
          >
            <Plus className="w-4 h-4" />
            Criar Primeiro Time
          </button>
        </div>
      )}

      {teams.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ─── Left: Teams List ────────────────────────── */}
          <div className="lg:col-span-1 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy bg-white transition-all"
                placeholder="Buscar times..."
              />
            </div>

            {/* Team Cards */}
            <div className="space-y-2">
              {filteredTeams.map((team) => (
                <div
                  key={team.id}
                  onClick={() => handleSelectTeam(team)}
                  className={cn(
                    'bg-white border rounded-xl p-4 cursor-pointer transition-all',
                    selectedTeamId === team.id
                      ? 'border-brand-navy ring-1 ring-brand-navy/20 shadow-md'
                      : 'border-slate-200 hover:shadow-sm hover:border-slate-300'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                        selectedTeamId === team.id ? 'bg-brand-navy' : 'bg-ice-blue'
                      )}>
                        <Users className={cn('w-4 h-4', selectedTeamId === team.id ? 'text-brand-lime' : 'text-brand-navy')} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-brand-navy truncate">{team.name}</h4>
                        {team.description && (
                          <p className="text-[11px] text-slate-400 truncate">{team.description}</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={cn(
                      'w-4 h-4 shrink-0 transition-transform',
                      selectedTeamId === team.id ? 'text-brand-navy rotate-90' : 'text-slate-300'
                    )} />
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                    <span>{new Date(team.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Right: Team Detail ──────────────────────── */}
          <div className="lg:col-span-2">
            {!selectedTeam ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-slate-200 rounded-xl">
                <Users className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-400">Selecione um time</p>
                <p className="text-xs text-slate-300 mt-1">Clique em um time para ver detalhes e gerenciar squads</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Team Header */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-brand-navy flex items-center justify-center">
                        <Users className="w-6 h-6 text-brand-lime" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-brand-navy font-display">{selectedTeam.name}</h2>
                        <p className="text-xs text-slate-400 mt-0.5">{selectedTeam.description || 'Sem descrição'}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                          <span>{members.length} membro{members.length !== 1 ? 's' : ''}</span>
                          <span>Criado em {new Date(selectedTeam.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditTeam(selectedTeam); setShowTeamDialog(true) }}
                        className="p-2 rounded-lg text-slate-400 hover:text-brand-navy hover:bg-ice-blue transition-all"
                        title="Editar time"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'team', id: selectedTeam.id, name: selectedTeam.name })}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        title="Excluir time"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-ice-blue/50 rounded-xl p-4 text-center border border-ice-blue">
                      <p className="text-2xl font-bold text-brand-navy">{members.length}</p>
                      <p className="text-[10px] text-slate-500 font-medium">Membros</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
                      <p className="text-2xl font-bold text-green-700">{squads.length}</p>
                      <p className="text-[10px] text-green-600 font-medium">Squads</p>
                    </div>
                  </div>
                </div>

                {/* Members */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-ice-blue flex items-center justify-center">
                      <UserPlus className="w-4 h-4 text-brand-navy" />
                    </div>
                    <div>
                      <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-400">Membros do Time</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Membros atribuídos a este time</p>
                    </div>
                  </div>
                  {members.length === 0 ? (
                    <div className="text-center py-6">
                      <Users className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">Nenhum membro neste time</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {members.map((m) => (
                        <div key={m.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-navy flex items-center justify-center">
                              <span className="text-[10px] font-bold text-brand-lime">
                                {m.userId.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-brand-navy">{m.userId}</p>
                              <p className="text-[11px] text-slate-400 capitalize">{m.role.toLowerCase()}</p>
                            </div>
                          </div>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-[9px] font-bold',
                            m.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          )}>
                            {m.status === 'ACTIVE' ? 'Ativo' : m.status === 'INVITED' ? 'Convite' : 'Desativado'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Squads */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                        <FolderKanban className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-400">Squads</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">Sub-times dentro deste time</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setEditSquad(null); setShowSquadDialog(true) }}
                      className="inline-flex items-center gap-1.5 px-3 h-7 rounded-full text-[10px] font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      Novo Squad
                    </button>
                  </div>
                  {squads.length === 0 ? (
                    <div className="text-center py-6">
                      <FolderKanban className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">Nenhum squad criado</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {squads.map((squad) => (
                        <div key={squad.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <FolderKanban className="w-4 h-4 text-amber-600" />
                              <h4 className="text-sm font-bold text-brand-navy">{squad.name}</h4>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => { setEditSquad(squad); setShowSquadDialog(true) }}
                                className="p-1 rounded text-slate-400 hover:text-brand-navy hover:bg-white transition-all"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ type: 'squad', id: squad.id, name: squad.name })}
                                className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-white transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          {squad.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-2">{squad.description}</p>
                          )}
                          {squad.leadId && (
                            <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
                              <Crown className="w-3 h-3 text-amber-500" />
                              Lead: {squad.leadId.substring(0, 8)}...
                            </div>
                          )}
                          <div className="mt-2 text-[10px] text-slate-300">
                            {new Date(squad.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <TeamDialog open={showTeamDialog} onClose={() => setShowTeamDialog(false)} editTeam={editTeam} />
      <SquadDialog
        open={showSquadDialog}
        onClose={() => setShowSquadDialog(false)}
        editSquad={editSquad}
        workspaceId="default"
      />

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-brand-navy mb-2">Confirmar exclusão</h3>
            <p className="text-xs text-slate-400 mb-4">
              Tem certeza que deseja excluir o {deleteConfirm.type === 'team' ? 'time' : 'squad'} <strong>{deleteConfirm.name}</strong>?
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 h-8 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-4 h-8 rounded-full text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-all"
              >
                <Trash2 className="w-3 h-3" />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
