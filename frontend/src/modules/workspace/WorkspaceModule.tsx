import { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Settings,
  Users,
  Trash2,
  Pencil,
  Check,
  X,
  Mail,
  UserPlus,
  Globe,
  FolderOpen,
  ChevronRight,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { teamsApi, type Team } from "@/api/teams";
import type { Organization, Workspace } from "@/types/workspace.types";

export default function WorkspaceModule() {
  const {
    organizations,
    activeOrg,
    workspaces,
    activeWorkspace,
    invitations,
    loading,
    error,
    fetchOrganizations,
    selectOrganization,
    createOrganization,
    updateOrganization,
    fetchWorkspaces,
    selectWorkspace,
    createWorkspace,
    deleteWorkspace,
    fetchInvitations,
    inviteMember,
    cancelInvitation,
  } = useWorkspaceStore();

  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showCreateWs, setShowCreateWs] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [wsName, setWsName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    fetchOrganizations();
  }, []);
  useEffect(() => {
    if (activeOrg) {
      fetchWorkspaces(activeOrg.id);
      fetchInvitations(activeOrg.id);
      loadTeams();
    }
  }, [activeOrg]);

  async function loadTeams() {
    if (!activeOrg) return;
    try {
      const t = await teamsApi.listTeams(activeOrg.id);
      setTeams(t);
    } catch {
      setTeams([]);
    }
  }

  function handleCreateOrg() {
    if (!orgName.trim() || !orgSlug.trim()) return;
    createOrganization(orgName.trim(), orgSlug.trim());
    setShowCreateOrg(false);
    setOrgName("");
    setOrgSlug("");
  }

  function handleCreateWs() {
    if (!activeOrg || !wsName.trim()) return;
    createWorkspace(activeOrg.id, wsName.trim());
    setShowCreateWs(false);
    setWsName("");
  }

  function handleInvite() {
    if (!activeOrg || !inviteEmail.trim()) return;
    inviteMember(activeOrg.id, inviteEmail.trim(), inviteRole);
    setShowInvite(false);
    setInviteEmail("");
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Organização</h1>
          <p className="text-sm text-gray-400 mt-1">
            Gerencie sua organização, workspaces e membros
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOrganizations()}
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
          </Button>
        </div>
      </div>

      {error && (
        <Card className="p-4 border-red-800 bg-red-950/20">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        </Card>
      )}

      {/* Organization Selector */}
      <Card className="p-4 border-brand-navy bg-brand-navy/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-brand-lime" />
            <div>
              {activeOrg ? (
                <>
                  <h2 className="text-lg font-semibold text-white">
                    {activeOrg.name}
                  </h2>
                  <p className="text-sm text-gray-400">
                    /{activeOrg.slug} · {activeOrg.memberCount} membros
                  </p>
                </>
              ) : (
                <p className="text-gray-400">Nenhuma organização selecionada</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {organizations.length > 1 && (
              <select
                className="bg-brand-navy border border-gray-700 rounded px-3 py-1.5 text-sm text-white"
                value={activeOrg?.id || ""}
                onChange={(e) => {
                  const org = organizations.find(
                    (o) => o.id === e.target.value,
                  );
                  if (org) selectOrganization(org);
                }}
              >
                {organizations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            )}
            <Button size="sm" onClick={() => setShowCreateOrg(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nova Organização
            </Button>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="workspaces">
        <TabsList>
          <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
          <TabsTrigger value="teams">Times</TabsTrigger>
          <TabsTrigger value="members">Membros</TabsTrigger>
        </TabsList>

        {/* Workspaces Tab */}
        <TabsContent value="workspaces" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-400">
              Workspaces ({workspaces.length})
            </h3>
            <Button
              size="sm"
              onClick={() => setShowCreateWs(true)}
              disabled={!activeOrg}
            >
              <Plus className="h-4 w-4 mr-1" /> Novo Workspace
            </Button>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : workspaces.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-gray-700">
              <FolderOpen className="h-10 w-10 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500">Nenhum workspace ainda</p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {workspaces.map((ws) => (
                <Card
                  key={ws.id}
                  className={cn(
                    "p-4 border transition-colors cursor-pointer hover:border-brand-lime/30",
                    activeWorkspace?.id === ws.id
                      ? "border-brand-lime bg-brand-lime/5"
                      : "border-gray-800",
                  )}
                  onClick={() => selectWorkspace(ws)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FolderOpen className="h-5 w-5 text-brand-lime" />
                      <div>
                        <p className="font-medium text-white">{ws.name}</p>
                        {ws.description && (
                          <p className="text-xs text-gray-500">
                            {ws.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Settings className="h-3 w-3 mr-1" />
                        {ws.settings ? Object.keys(ws.settings).length : 0}{" "}
                        configs
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7 text-gray-500 hover:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteWorkspace(activeOrg!.id, ws.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-4">
          <h3 className="text-sm font-medium text-gray-400">
            Times ({teams.length})
          </h3>
          {teams.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-gray-700">
              <Users className="h-10 w-10 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500">Nenhum time criado</p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {teams.map((team) => (
                <Card key={team.id} className="p-4 border-gray-800">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="font-medium text-white">{team.name}</p>
                      <p className="text-xs text-gray-500">
                        {team.description || "Sem descrição"}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-400">
              Convites Pendentes ({invitations.length})
            </h3>
            <Button
              size="sm"
              onClick={() => setShowInvite(true)}
              disabled={!activeOrg}
            >
              <UserPlus className="h-4 w-4 mr-1" /> Convidar Membro
            </Button>
          </div>
          {invitations.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-gray-700">
              <Mail className="h-10 w-10 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500">Nenhum convite pendente</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {invitations.map((inv) => (
                <Card
                  key={inv.id}
                  className="p-3 border-gray-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-white">{inv.email}</p>
                      <Badge variant="outline" className="text-xs">
                        {inv.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        "text-xs",
                        inv.status === "pending" &&
                          "bg-yellow-500/10 text-yellow-400",
                        inv.status === "accepted" &&
                          "bg-green-500/10 text-green-400",
                        inv.status === "expired" &&
                          "bg-red-500/10 text-red-400",
                      )}
                    >
                      {inv.status}
                    </Badge>
                    {inv.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7 text-gray-500 hover:text-red-400"
                        onClick={() => cancelInvitation(activeOrg!.id, inv.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Org Dialog */}
      <Dialog open={showCreateOrg} onOpenChange={setShowCreateOrg}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Organização</DialogTitle>
            <DialogDescription>
              Nome e slug para sua nova organização
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400">Nome</label>
              <Input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Minha Org"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Slug</label>
              <Input
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
                placeholder="minha-org"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreateOrg}
              disabled={!orgName.trim() || !orgSlug.trim()}
            >
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Workspace Dialog */}
      <Dialog open={showCreateWs} onOpenChange={setShowCreateWs}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Workspace</DialogTitle>
            <DialogDescription>
              Crie um workspace dentro da organização
            </DialogDescription>
          </DialogHeader>
          <Input
            value={wsName}
            onChange={(e) => setWsName(e.target.value)}
            placeholder="Nome do workspace"
          />
          <DialogFooter>
            <Button onClick={handleCreateWs} disabled={!wsName.trim()}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Membro</DialogTitle>
            <DialogDescription>Envie um convite por email</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@exemplo.com"
              type="email"
            />
            <select
              className="w-full bg-brand-navy border border-gray-700 rounded px-3 py-2 text-sm text-white"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              <option value="member">Membro</option>
              <option value="admin">Admin</option>
              <option value="viewer">Visualizador</option>
            </select>
          </div>
          <DialogFooter>
            <Button onClick={handleInvite} disabled={!inviteEmail.trim()}>
              Convidar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
