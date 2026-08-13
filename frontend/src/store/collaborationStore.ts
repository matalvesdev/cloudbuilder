import { create } from "zustand";
import { nanoId } from "@/lib/utils";
import type {
  TeamMember,
  TeamMemberRole,
  TeamMemberStatus,
  Comment,
  ShareLink,
} from "@/types/collaboration.types";

const NOW = () => new Date().toISOString();

interface CollaborationState {
  teamMembers: TeamMember[];
  comments: Comment[];
  shareLinks: ShareLink[];
  selectedCommentNodeId: string | null;

  addComment: (
    nodeId: string | null,
    authorId: string,
    authorName: string,
    authorAvatar: string,
    content: string,
  ) => void;
  resolveComment: (commentId: string) => void;
  getCommentsByNode: (nodeId: string) => Comment[];
  inviteMember: (name: string, email: string, role: TeamMemberRole) => void;
  removeMember: (memberId: string) => void;
  updateMemberStatus: (memberId: string, status: TeamMemberStatus) => void;
  generateShareLink: (designId: string, createdBy: string) => string;
  setSelectedCommentNodeId: (nodeId: string | null) => void;
}

export const useCollaborationStore = create<CollaborationState>()(
  (set, get) => ({
    teamMembers: [],
    comments: [],
    shareLinks: [],
    selectedCommentNodeId: null,

    addComment: (nodeId, authorId, authorName, authorAvatar, content) => {
      const newComment: Comment = {
        id: crypto.randomUUID(),
        nodeId,
        authorId,
        authorName,
        authorAvatar,
        content,
        createdAt: NOW(),
        resolved: false,
      };
      set({ comments: [...get().comments, newComment] });
    },

    resolveComment: (commentId) => {
      set({
        comments: get().comments.map((c) =>
          c.id === commentId ? { ...c, resolved: true } : c,
        ),
      });
    },

    getCommentsByNode: (nodeId) => {
      return get().comments.filter((c) => c.nodeId === nodeId && !c.resolved);
    },

    inviteMember: (name, email, role) => {
      const newMember: TeamMember = {
        id: crypto.randomUUID(),
        name,
        email,
        avatar: name.charAt(0).toUpperCase(),
        role,
        status: "offline",
        lastSeen: NOW(),
      };
      set({ teamMembers: [...get().teamMembers, newMember] });
    },

    removeMember: (memberId) => {
      set({ teamMembers: get().teamMembers.filter((m) => m.id !== memberId) });
    },

    updateMemberStatus: (memberId, status) => {
      set({
        teamMembers: get().teamMembers.map((m) =>
          m.id === memberId ? { ...m, status, lastSeen: NOW() } : m,
        ),
      });
    },

    generateShareLink: (designId, createdBy) => {
      const token = nanoId(32);
      const expiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const newLink: ShareLink = {
        id: crypto.randomUUID(),
        designId,
        token,
        expiresAt,
        createdBy,
      };
      set({ shareLinks: [...get().shareLinks, newLink] });
      return token;
    },

    setSelectedCommentNodeId: (nodeId) =>
      set({ selectedCommentNodeId: nodeId }),
  }),
);
