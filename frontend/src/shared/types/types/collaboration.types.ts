export type TeamMemberRole = "owner" | "editor" | "viewer";
export type TeamMemberStatus = "online" | "offline" | "away";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: TeamMemberRole;
  status: TeamMemberStatus;
  lastSeen: string;
}

export interface Comment {
  id: string;
  nodeId: string | null;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  resolved: boolean;
}

export interface ShareLink {
  id: string;
  designId: string;
  token: string;
  expiresAt: string;
  createdBy: string;
}

export interface VersionEntry {
  id: string;
  version: number;
  name: string;
  nodeCount: number;
  edgeCount: number;
  savedAt: string;
}
