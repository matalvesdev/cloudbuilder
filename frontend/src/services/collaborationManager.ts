import { yjsBridge } from './yjsBridge'
import { useCanvasStore } from '@/store/canvasStore'
import { useCollaborationStore } from '@/store/collaborationStore'

/**
 * CollaborationManager: Wires together canvasStore ↔ YjsBridge ↔ WebSocket server.
 *
 * - Listens to local canvasStore changes → pushes to Yjs → broadcast to peers
 * - Listens to Yjs remote changes → applies to canvasStore
 * - Listens to Yjs presence → updates collaborationStore team member status
 */
class CollaborationManager {
  private unsubCanvas: (() => void) | null = null
  private active = false
  private currentUserId = ''

  /**
   * Start the collaboration session.
   * Connects to the WebSocket room, subscribes to stores, and begins syncing.
   */
  start(
    roomId: string,
    serverUrl: string,
    userInfo: { id: string; name: string; avatar: string },
    tenantId?: string,
  ): void {
    if (this.active) this.stop()
    this.active = true
    this.currentUserId = userInfo.id

    // Namespace collaboration rooms by tenant for multi-tenant isolation
    const tenantRoomId = tenantId ? `${tenantId}:${roomId}` : roomId
    yjsBridge.connect(tenantRoomId, serverUrl, userInfo)

    // ── Remote sync: Yjs → canvasStore ──────────────────────────────
    yjsBridge.onSync((nodes, edges, meta) => {
      const store = useCanvasStore.getState()
      useCanvasStore.setState({
        nodes,
        edges,
        canvasName: (meta.name as string) ?? store.canvasName,
        canvasVersion: (meta.version as number) ?? store.canvasVersion,
      })
    })

    // ── Presence: Yjs → collaborationStore ──────────────────────────
    yjsBridge.onPresence((users) => {
      const collab = useCollaborationStore.getState()
      for (const u of users) {
        // Update online status for matched members
        const existing = collab.teamMembers.find((m) => m.id === u.id)
        if (existing) {
          collab.updateMemberStatus(u.id, u.status)
        } else {
          // New peer not in our member list → add as temporary editor
          collab.inviteMember(u.name, `collab-${u.id}@local`, 'editor')
          collab.updateMemberStatus(u.id, u.status)
        }
      }
    })

    // ── Connection status ────────────────────────────────────────────
    yjsBridge.onConnection((connected) => {
      if (!connected) return
      // On (re)connect, push current local state so peers get our version
      const canvas = useCanvasStore.getState()
      yjsBridge.pushLocalState(canvas.nodes, canvas.edges, {
        name: canvas.canvasName,
        version: canvas.canvasVersion,
      })
    })

    // ── Local changes: canvasStore → Yjs ────────────────────────────
    let pending = false
    this.unsubCanvas = useCanvasStore.subscribe((state) => {
      if (!yjsBridge.isConnected()) return
      if (pending) return
      pending = true
      // Microtask delay to batch multiple mutations in one tick
      queueMicrotask(() => {
        pending = false
        yjsBridge.pushLocalState(state.nodes, state.edges, {
          name: state.canvasName,
          version: state.canvasVersion,
        })
      })
    })
  }

  /**
   * Stop the collaboration session.
   * Disconnects WebSocket, unsubscribes from stores, cleans up Yjs doc.
   */
  stop(): void {
    this.active = false
    this.currentUserId = ''
    this.unsubCanvas?.()
    this.unsubCanvas = null
    yjsBridge.disconnect()
  }

  /** Whether collaboration is currently active. */
  isActive(): boolean {
    return this.active
  }

  /** Whether WebSocket is currently connected. */
  isConnected(): boolean {
    return yjsBridge.isConnected()
  }

  /** Send cursor position to peers. */
  sendCursor(cursor: { x: number; y: number } | null): void {
    if (!this.active) return
    yjsBridge.sendAwareness({ cursor, userId: this.currentUserId })
  }

  /** Expose raw WebSocket for CursorsOverlay awareness messages. */
  getWsAccessor(): WebSocket | null {
    return yjsBridge.wsAccessor
  }

  /** Get the current user's ID. */
  getUserId(): string {
    return this.currentUserId
  }
}

export const collaborationManager = new CollaborationManager()
