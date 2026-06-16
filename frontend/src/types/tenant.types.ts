export type ProjectRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Project {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  resourceCount: number;
  createdAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: ProjectRole;
  joinedAt: string;
}

export interface InviteRequest {
  email: string;
  role: ProjectRole;
}

export const ROLE_LABELS: Record<ProjectRole, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  member: 'Membro',
  viewer: 'Visualizador',
};

export const ROLE_HIERARCHY: ProjectRole[] = ['viewer', 'member', 'admin', 'owner'];
