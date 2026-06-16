import * as Y from 'yjs'
import type { Node, Edge } from '@xyflow/react'
import type { CanvasNodeData, CanvasDesign } from '@/types/canvas.types'
import type { TeamMember } from '@/types/collaboration.types'

/**
 * YjsBridge: Synchronizes canvasStore state across peers using Yjs CRDT + a
 * custom Go WebSocket server (provision-engine collab-server).
 *
 * Architecture:
 *   Y.Doc ──Y.Array/nodes──→ canvasStore.nodes
 *          ──Y.Array/edges──→ canvasStore.edges
 *          ──Y.Map/meta─────→ canvas name/version
 *          ──Y.Array/comments→ collaborationStore.comments
 *
 * Binary Yjs updates are relayed through the WebSocket server to all room peers.
 * JSON messages handle presence/awareness (cursor, selection, viewport).
 */

type SyncDocCallback = (
  nodes: Node<CanvasNodeData>[],
  edges: Edge[],
  meta: Record<string, unknown>,
) => void

type PresenceCallback = (users: TeamMember[]) => void

type ConnectionCallback = (connected: boolean) => void

const RECONNECT_DELAY_MS = 3000
const MAX_RECONNECT_ATTEMPTS = 20
const YJS_ORIGIN_LOCAL = 'local'

class YjsBridge {
  private doc: Y.Doc | null = null
  private ws: WebSocket | null = null
  private roomId = ''
  private serverUrl = ''

  private yNodes: Y.Array<Y.Map<unknown>> | null = null
  private yEdges: Y.Array<Y.Map<unknown>> | null = null
  private yMeta: Y.Map<unknown> | null = null
  private yComments: Y.Array<Y.Map<unknown>> | null = null

  private connected = false
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private syncTimer: ReturnType<typeof setTimeout> | null = null

  // Prevent echo: set when applying remote changes to canvasStore
  private applyingRemote = false
  // Prevent echo: set when pushing local changes to Yjs
  private syncingToYjs = false

  // Origin marker for Yjs transactions
  private syncingOrigin: unknown = null

  private onSyncCallback: SyncDocCallback | null = null
  private onPresenceCallback: PresenceCallback | null = null
  private onConnectionCallback: ConnectionCallback | null = null

  // ─── Connection ─────────────────────────────────────────────────────

  connect(
    roomId: string,
    serverUrl: string,
    userInfo: { id: string; name: string; avatar: string },
  ): void {
    if (this.connected) this.disconnect()

    this.roomId = roomId
    this.serverUrl = serverUrl
    this.reconnectAttempts = 0

    this.doc = new Y.Doc()
    this.yNodes = this.doc.getArray('nodes')
    this.yEdges = this.doc.getArray('edges')
    this.yMeta = this.doc.getMap('meta')
    this.yComments = this.doc.getArray('comments')

    // Listen for remote changes from Yjs
    this.doc.on('update', (_update: Uint8Array, origin: unknown) => {
      if (origin === YJS_ORIGIN_LOCAL) return // Don't echo local changes
      this.handleRemoteChange()
    })

    this.createWebSocket(userInfo)
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
      this.syncTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    if (this.doc) {
      this.doc.destroy()
      this.doc = null
    }
    this.connected = false
    this.yNodes = null
    this.yEdges = null
    this.yMeta = null
    this.yComments = null
    this.onConnectionCallback?.(false)
  }

  private createWebSocket(userInfo: { id: string; name: string; avatar: string }): void {
    const url = `${this.serverUrl}/ws/${this.roomId}`
    this.ws = new WebSocket(url)
    this.ws.binaryType = 'arraybuffer'

    this.ws.onopen = () => {
      this.connected = true
      this.reconnectAttempts = 0
      this.onConnectionCallback?.(true)

      // Send user info so the server broadcasts presence
      this.ws!.send(JSON.stringify({
        type: 'userinfo',
        name: userInfo.name,
        avatar: userInfo.avatar,
        userId: userInfo.id,
      }))
    }

    this.ws.onmessage = (event: MessageEvent) => {
      if (event.data instanceof ArrayBuffer) {
        // Binary message = Yjs sync update from a peer
        const update = new Uint8Array(event.data)
        this.applyRemoteYjsUpdate(update)
      } else if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'presence') {
            this.onPresenceCallback?.(msg.users as TeamMember[])
          }
        } catch {
          // Ignore unparseable messages
        }
      }
    }

    this.ws.onclose = () => {
      this.connected = false
      this.onConnectionCallback?.(false)
      this.scheduleReconnect(userInfo)
    }

    this.ws.onerror = () => {
      // onclose will fire next
    }
  }

  private scheduleReconnect(userInfo: { id: string; name: string; avatar: string }): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return
    this.reconnectAttempts++
    const delay = Math.min(RECONNECT_DELAY_MS * this.reconnectAttempts, 30000)
    this.reconnectTimer = setTimeout(() => {
      this.createWebSocket(userInfo)
    }, delay)
  }

  // ─── Sync: Local → Yjs → Peers ──────────────────────────────────────

  /**
   * Called by canvasStore when local state changes.
   * Pushes the full node/edge/meta state into Yjs, which generates a
   * binary update that is sent to all room peers via WebSocket.
   */
  pushLocalState(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[],
    meta?: Record<string, unknown>,
  ): void {
    if (!this.doc || !this.yNodes || !this.yEdges || this.applyingRemote) return
    if (this.syncingToYjs) return
    this.syncingToYjs = true

    this.doc.transact(() => {
      // Merge nodes into Y.Array
      const currentYjsNodes = this.yNodes!.toJSON() as unknown[]
      if (!this.arraysEqual(currentYjsNodes, nodes)) {
        this.yNodes!.delete(0, this.yNodes!.length)
        for (const n of nodes) {
          this.yNodes!.push([new Y.Map(Object.entries(serializeNode(n)))])
        }
      }

      // Merge edges into Y.Array
      const currentYjsEdges = this.yEdges!.toJSON() as unknown[]
      if (!this.arraysEqual(currentYjsEdges, edges)) {
        this.yEdges!.delete(0, this.yEdges!.length)
        for (const e of edges) {
          this.yEdges!.push([new Y.Map(Object.entries(serializeEdge(e)))])
        }
      }

      // Merge meta
      if (meta) {
        for (const [key, value] of Object.entries(meta)) {
          this.yMeta!.set(key, value)
        }
      }
    }, YJS_ORIGIN_LOCAL)

    this.syncingToYjs = false
    this.flushSync()
  }

  /**
   * Sends the current Yjs state as a sync update to peers.
   * Debounced to batch rapid changes into a single binary message.
   */
  private flushSync(): void {
    if (!this.connected || !this.ws || !this.doc) return
    if (this.syncTimer) clearTimeout(this.syncTimer)
    this.syncTimer = setTimeout(() => {
      const update = Y.encodeStateAsUpdate(this.doc!)
      if (update.byteLength > 0 && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(update)
      }
    }, 100)
  }

  // ─── Sync: Remote → Yjs → canvasStore ──────────────────────────────

  private applyRemoteYjsUpdate(update: Uint8Array): void {
    if (!this.doc) return
    Y.applyUpdate(this.doc, update)
  }

  private handleRemoteChange(): void {
    if (!this.onSyncCallback || !this.yNodes || !this.yEdges) return
    if (this.syncingToYjs) return
    this.applyingRemote = true

    const nodes = (this.yNodes!.toJSON() as Record<string, unknown>[]).map(
      (raw) => deserializeNode(raw),
    )
    const edges = (this.yEdges!.toJSON() as Record<string, unknown>[]).map(
      (raw) => deserializeEdge(raw),
    )
    const meta = this.yMeta?.toJSON() as Record<string, unknown>

    this.onSyncCallback(nodes, edges, meta)
    this.applyingRemote = false
  }

  // ─── Awareness (cursor, selection) ─────────────────────────────────

  sendAwareness(payload: Record<string, unknown>): void {
    if (!this.connected || !this.ws) return
    this.ws.send(JSON.stringify({ type: 'awareness', ...payload }))
  }

  // ─── Callbacks ──────────────────────────────────────────────────────

  onSync(cb: SyncDocCallback): void {
    this.onSyncCallback = cb
  }

  onPresence(cb: PresenceCallback): void {
    this.onPresenceCallback = cb
  }

  onConnection(cb: ConnectionCallback): void {
    this.onConnectionCallback = cb
  }

  // ─── Utility ────────────────────────────────────────────────────────

  isConnected(): boolean {
    return this.connected
  }

  getDoc(): Y.Doc | null {
    return this.doc
  }

  private arraysEqual(a: unknown[], b: unknown[]): boolean {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) return false
    }
    return true
  }
}

// ─── Serialization helpers ─────────────────────────────────────────────

function serializeNode(n: Node<CanvasNodeData>): Record<string, unknown> {
  return {
    id: n.id,
    type: n.type,
    position: n.position,
    data: n.data,
    width: n.width,
    height: n.height,
    selected: n.selected ?? false,
    draggable: n.draggable ?? true,
  }
}

function deserializeNode(raw: Record<string, unknown>): Node<CanvasNodeData> {
  return {
    id: raw.id as string,
    type: raw.type as string,
    position: raw.position as { x: number; y: number },
    data: raw.data as CanvasNodeData,
    width: raw.width as number,
    height: raw.height as number,
    selected: (raw.selected as boolean) ?? false,
    draggable: (raw.draggable as boolean) ?? true,
  }
}

function serializeEdge(e: Edge): Record<string, unknown> {
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    type: e.type,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    data: e.data,
  }
}

function deserializeEdge(raw: Record<string, unknown>): Edge {
  return {
    id: raw.id as string,
    source: raw.source as string,
    target: raw.target as string,
    type: raw.type as string,
    sourceHandle: raw.sourceHandle as string | undefined,
    targetHandle: raw.targetHandle as string | undefined,
    data: raw.data as Record<string, unknown> | undefined,
  }
}

export const yjsBridge = new YjsBridge()
