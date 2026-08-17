import { api } from "./client";

export interface Project {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  slug: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  joinedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

/**
 * List all projects for the current tenant.
 */
export function listProjects(): Promise<Project[]> {
  return api.get("/projects");
}

/**
 * Get a project by ID.
 */
export function getProject(id: string): Promise<Project> {
  return api.get(`/projects/${id}`);
}

/**
 * Create a new project.
 */
export function createProject(
  request: CreateProjectRequest,
): Promise<Project> {
  return api.post("/projects", request);
}

/**
 * Update an existing project.
 */
export function updateProject(
  id: string,
  request: CreateProjectRequest,
): Promise<Project> {
  return api.put(`/projects/${id}`, request);
}

/**
 * Delete a project.
 */
export function deleteProject(id: string): Promise<void> {
  return api.delete(`/projects/${id}`);
}

/**
 * List project members.
 */
export function listProjectMembers(
  projectId: string,
): Promise<ProjectMember[]> {
  return api.get(`/projects/${projectId}/members`);
}

/**
 * Invite a member to the project.
 */
export function inviteProjectMember(
  projectId: string,
  email: string,
  role: string,
): Promise<ProjectMember> {
  return api.post(`/projects/${projectId}/members`, { email, role });
}

/**
 * Remove a member from the project.
 */
export function removeProjectMember(
  projectId: string,
  userId: string,
): Promise<void> {
  return api.delete(`/projects/${projectId}/members/${userId}`);
}

/**
 * Update a member's role.
 */
export function updateMemberRole(
  projectId: string,
  userId: string,
  role: string,
): Promise<ProjectMember> {
  return api.put(`/projects/${projectId}/members/${userId}/role`, { role });
}

export const projectsApi = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  listProjectMembers,
  inviteProjectMember,
  removeProjectMember,
  updateMemberRole,
};
