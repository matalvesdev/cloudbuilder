export interface Workspace {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  settings: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string;
  ownerId: string;
  memberCount: number;
  createdAt: string;
}

export interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  status: "pending" | "accepted" | "expired";
  invitedAt: string;
}
