import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type {
  TeamMember,
  TeamMemberRole,
  TeamMemberStatus,
  Comment,
  ShareLink,
} from '@/types/collaboration.types'

const NOW = () => new Date().toISOString()

const MOCK_MEMBERS: TeamMember[] = [
  { id: nanoid(), name: 'Thiago', email: 'thiago@cloudbuilder.io', avatar: 'T', role: 'owner', status: 'online', lastSeen: NOW() },
  { id: nanoid(), name: 'Ana', email: 'ana@cloudbuilder.io', avatar: 'A', role: 'editor', status: 'online', lastSeen: NOW() },
  { id: nanoid(), name: 'Pedro', email: 'pedro@cloudbuilder.io', avatar: 'P', role: 'viewer', status: 'offline', lastSeen: new Date(Date.now() - 3600000).toISOString() },
  { id: nanoid(), name: 'Camila', email: 'camila@cloudbuilder.io', avatar: 'C', role: 'editor', status: 'away', lastSeen: new Date(Date.now() - 600000).toISOString() },
]

const MOCK_COMMENTS: Comment[] = [
  {
    id: nanoid(),
    nodeId: null,
    authorId: MOCK_MEMBERS[0].id,
    authorName: MOCK_MEMBERS[0].name,
    authorAvatar: MOCK_MEMBERS[0].avatar,
    content: 'Precisamos habilitar Multi-AZ para esta instância de banco de dados?',
    createdAt: new Date(Date.now() - 120000).toISOString(),
    resolved: false,
  },
  {
    id: nanoid(),
    nodeId: null,
    authorId: MOCK_MEMBERS[1].id,
    authorName: MOCK_MEMBERS[1].name,
    authorAvatar: MOCK_MEMBERS[1].avatar,
    content: 'Sim, para o ambiente de produção é mandatório. Vou atualizar as configurações.',
    createdAt: new Date().toISOString(),
    resolved: false,
  },
  {
    id: nanoid(),
    nodeId: null,
    authorId: MOCK_MEMBERS[2].id,
    authorName: MOCK_MEMBERS[2].name,
    authorAvatar: MOCK_MEMBERS[2].avatar,
    content: 'O range de IPs do CIDR foi ajustado.',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    resolved: true,
  },
]

interface CollaborationState {
  teamMembers: TeamMember[]
  comments: Comment[]
  shareLinks: ShareLink[]
  selectedCommentNodeId: string | null

  addComment: (nodeId: string | null, authorId: string, authorName: string, authorAvatar: string, content: string) => void
  resolveComment: (commentId: string) => void
  getCommentsByNode: (nodeId: string) => Comment[]
  inviteMember: (name: string, email: string, role: TeamMemberRole) => void
  removeMember: (memberId: string) => void
  updateMemberStatus: (memberId: string, status: TeamMemberStatus) => void
  generateShareLink: (designId: string, createdBy: string) => string
  setSelectedCommentNodeId: (nodeId: string | null) => void
}

export const useCollaborationStore = create<CollaborationState>()(
  persist(
    (set, get) => ({
      teamMembers: MOCK_MEMBERS,
      comments: MOCK_COMMENTS,
      shareLinks: [],
      selectedCommentNodeId: null,

      addComment: (nodeId, authorId, authorName, authorAvatar, content) => {
        const newComment: Comment = {
          id: nanoid(),
          nodeId,
          authorId,
          authorName,
          authorAvatar,
          content,
          createdAt: NOW(),
          resolved: false,
        }
        set({ comments: [...get().comments, newComment] })
      },

      resolveComment: (commentId) => {
        set({
          comments: get().comments.map((c) =>
            c.id === commentId ? { ...c, resolved: true } : c
          ),
        })
      },

      getCommentsByNode: (nodeId) => {
        return get().comments.filter((c) => c.nodeId === nodeId && !c.resolved)
      },

      inviteMember: (name, email, role) => {
        const newMember: TeamMember = {
          id: nanoid(),
          name,
          email,
          avatar: name.charAt(0).toUpperCase(),
          role,
          status: 'offline',
          lastSeen: NOW(),
        }
        set({ teamMembers: [...get().teamMembers, newMember] })
      },

      removeMember: (memberId) => {
        set({ teamMembers: get().teamMembers.filter((m) => m.id !== memberId) })
      },

      updateMemberStatus: (memberId, status) => {
        set({
          teamMembers: get().teamMembers.map((m) =>
            m.id === memberId ? { ...m, status, lastSeen: NOW() } : m
          ),
        })
      },

      generateShareLink: (designId, createdBy) => {
        const token = nanoid(32)
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        const newLink: ShareLink = {
          id: nanoid(),
          designId,
          token,
          expiresAt,
          createdBy,
        }
        set({ shareLinks: [...get().shareLinks, newLink] })
        return token
      },

      setSelectedCommentNodeId: (nodeId) => set({ selectedCommentNodeId: nodeId }),
    }),
    {
      name: 'cloudbuilder-collaboration',
      partialize: (state) => ({
        teamMembers: state.teamMembers,
        comments: state.comments,
        shareLinks: state.shareLinks,
      }),
    }
  )
)
