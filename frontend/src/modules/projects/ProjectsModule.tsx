import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, EmptyState } from "@/design-system/components/StatusBadge";
import {
  Folder,
  Plus,
  Archive,
  Play,
  Settings,
  GitBranch,
  Loader2,
  Trash2,
  RefreshCw,
} from "lucide-react";
import {
  projectsApi,
  type Project,
} from "@/api/projects";
import { useAuthStore } from "@/store/authStore";

export function ProjectsModule() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const authUser = useAuthStore((s) => s.user);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectsApi.listProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar projetos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authUser?.tenantId) {
      fetchProjects();
    }
  }, [authUser?.tenantId, fetchProjects]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await projectsApi.createProject({
        name: newName.trim(),
        description: newDescription.trim() || undefined,
      });
      setNewName("");
      setNewDescription("");
      setShowCreate(false);
      await fetchProjects();
    } catch (err: any) {
      setError(err?.message || "Erro ao criar projeto");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este projeto?")) return;
    try {
      await projectsApi.deleteProject(id);
      await fetchProjects();
    } catch (err: any) {
      setError(err?.message || "Erro ao excluir projeto");
    }
  };

  const filtered = search
    ? projects.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      )
    : projects;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Projetos</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {loading ? "Carregando..." : `${projects.length} projetos`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProjects}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" /> Novo Projeto
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Criar Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Nome do projeto"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Input
              placeholder="Descrição (opcional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Criar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreate(false);
                  setNewName("");
                  setNewDescription("");
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Input
        placeholder="Buscar projetos..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {/* Loading */}
      {loading && projects.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      )}

      {/* Project List */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <Card
              key={project.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <StatusBadge
                    status={project.active ? "completed" : "cancelled"}
                    label={project.active ? "ativo" : "arquivado"}
                    size="sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {project.description && (
                  <p className="text-sm text-neutral-600 mb-3">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">
                    <GitBranch className="h-3 w-3" />
                    {project.slug || project.name.toLowerCase().replace(/\s+/g, "-")}
                  </span>
                  <span>
                    {project.createdAt
                      ? new Date(project.createdAt).toLocaleDateString("pt-BR")
                      : ""}
                  </span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Play className="h-3 w-3 mr-1" /> Deploy
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(project.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && projects.length === 0 && (
        <EmptyState
          icon={<Folder className="h-6 w-6 text-neutral-400" />}
          title="Nenhum projeto encontrado"
          description="Crie seu primeiro projeto para começar"
          action={{
            label: "Criar Projeto",
            onClick: () => setShowCreate(true),
          }}
        />
      )}

      {!loading && filtered.length === 0 && projects.length > 0 && (
        <EmptyState
          icon={<Folder className="h-6 w-6 text-neutral-400" />}
          title="Nenhum projeto encontrado"
          description={`Nenhum projeto corresponde a "${search}"`}
        />
      )}
    </div>
  );
}
