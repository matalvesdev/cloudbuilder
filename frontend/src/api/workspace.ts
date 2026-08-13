import { api } from "./client";

export interface WorkspaceDTO {
  id: string;
  name: string;
  slug: string;
  description: string;
  organizationId: string;
  settings: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export function listWorkspaces(orgId?: string): Promise<WorkspaceDTO[]> {
  return api.get(`/workspaces${orgId ? `?orgId=${orgId}` : ""}`);
}

export function listOrganizations(): Promise<any[]> {
  return api.get("/organizations");
}

export function createOrganization(data: { name: string; slug: string; description?: string }): Promise<any> {
  return api.post("/organizations", data);
}

export function updateOrganization(id: string, data: any): Promise<any> {
  return api.put(`/organizations/${id}`, data);
}

export function createWorkspace(orgId: string, data: any): Promise<WorkspaceDTO> {
  return api.post(`/workspaces?orgId=${orgId}`, data);
}

export function deleteWorkspace(orgId: string, id: string): Promise<void> {
  return api.delete(`/workspaces/${id}?orgId=${orgId}`);
}

export function listInvitations(orgId: string): Promise<any[]> {
  return api.get(`/invitations?orgId=${orgId}`);
}

export function inviteMember(orgId: string, email: string, role: string): Promise<void> {
  return api.post(`/invitations?orgId=${orgId}`, { email, role });
}

export function cancelInvitation(orgId: string, invitationId: string): Promise<void> {
  return api.delete(`/invitations/${invitationId}?orgId=${orgId}`);
}

export const workspaceApi = {
  listWorkspaces,
  listOrganizations,
  createOrganization,
  updateOrganization,
  createWorkspace,
  deleteWorkspace,
  listInvitations,
  inviteMember,
  cancelInvitation,
};
