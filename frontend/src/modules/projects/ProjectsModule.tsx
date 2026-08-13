// Projects Module - Workspace and project management

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  StatusBadge,
  EmptyState,
} from "@/design-system/components/StatusBadge";
import { Folder, Plus, Archive, Play, Settings, GitBranch } from "lucide-react";

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: "active" | "archived";
  defaultBranch: string;
  createdAt: string;
}

const mockProjects: Project[] = [
  {
    id: "1",
    name: "Production Infrastructure",
    slug: "prod-infra",
    description: "Main production environment",
    status: "active",
    defaultBranch: "main",
    createdAt: "2026-01-15",
  },
  {
    id: "2",
    name: "Staging Environment",
    slug: "staging",
    description: "Staging for pre-production testing",
    status: "active",
    defaultBranch: "main",
    createdAt: "2026-02-20",
  },
  {
    id: "3",
    name: "Legacy Migration",
    slug: "legacy",
    description: "Migrated from old system",
    status: "archived",
    defaultBranch: "main",
    createdAt: "2025-06-10",
  },
];

export function ProjectsModule() {
  const [projects, setProjects] = useState(mockProjects);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = search
    ? projects.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      )
    : projects;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Projects</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {projects.length} projects
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Project
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Search projects..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {/* Project List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((project) => (
          <Card
            key={project.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <StatusBadge
                  status={
                    project.status === "active" ? "completed" : "cancelled"
                  }
                  label={project.status}
                  size="sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600 mb-3">
                {project.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  <GitBranch className="h-3 w-3" />
                  {project.defaultBranch}
                </span>
                <span>{project.createdAt}</span>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1">
                  <Play className="h-3 w-3 mr-1" /> Deploy
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <EmptyState
          icon={<Folder className="h-6 w-6 text-neutral-400" />}
          title="No projects found"
          description="Create your first project to get started"
          action={{
            label: "Create Project",
            onClick: () => setShowCreate(true),
          }}
        />
      )}
    </div>
  );
}
