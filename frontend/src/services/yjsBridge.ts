import type { Node, Edge } from '@xyflow/react'
import type { CanvasNodeData } from '@/types/canvas.types'
import type { TeamMember } from '@/types/collaboration.types'

/**
 * NativeEventBus: Replaces Yjs CRDT with a simple WebSocket-based state
 * synchronization. Uses plain JSON messages instead of binary Yjs updates.
 *
 * Architecture:
 *   Local state ──JSON──→ WebSocket ──JSON──→ Remote peers
 *
 * Since the collaboration server is a stub (not yet deployed), this
 * implementation keeps the full WebSocket lifecycle but removes the
 * Yjs dependency entirely.
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

/* ─── Simple EventEmitter ─────────────────────── */

type EventMap = {
  sync: [Node<CanvasNodeData>[], Edge[], Record<string, unknown>]
  presence: [TeamMember[]]
  connection: [boolean]
}

class EventBus {
  private handlers = new Map<string, Set<(...args: unknown[]) => void>>()

  on<K extends keyof EventMap>(event: K, cb: (...args: EventMap[K]) => void): void {
    if (!this.handlers.has(event as string)) this.handlers.set(event as string, new Set())
    this.handlers.get(event as string)!.add(cb as (...args: unknown[]) => void)
  }

  off<K extends keyof EventMap>(event: K, cb: (...args: EventMap[K]) => void): void {
    this.handlers.get(event as string)?.delete(cb as (...args: unknown[]) => void)
  }

  emit<K extends keyof EventMap>(event: K, ...args: EventMap[K]): void {
    this.handlers.get(event as string)?.forEach((cb) => cb(...args))
  }

  removeAll(): void {
    this.handlers.clear()
  }
}

/* ─── Serialization ───────────────────────────── */

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

/* ─── NativeEventBus ──────────────────────────── */

class NativeEventBus {
  private ws: WebSocket | null = null
  private roomId = ''
  private serverUrl = ''
  private connected = false
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private syncTimer: ReturnType<typeof setTimeout> | null = null
  private events = new EventBus()

  // Prevent echo: set when applying remote changes
  private applyingRemote = false

  // Expose raw ws for CursorsOverlay access (backward compat)
  public wsAccessor: WebSocket | null = null

  // ─── Connection ─────────────────────────────────────────────────────

  connect(
    roomId: string,
    serverUrl: string,
    _userInfo: { id: string; name: string; avatar: string },
  ): void {
    if (this.connected) this.disconnect()

    this.roomId = roomId
    this.serverUrl = serverUrl
    this.reconnectAttempts = 0

    this.createWebSocket(_userInfo)
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
    this.wsAccessor = null
    this.connected = false
    this.events.removeAll()
    this.events.emit('connection', false)
  }

  private createWebSocket(userInfo: { id: string; name: string; avatar: string }): void {
    const url = `${this.serverUrl}/ws/${this.roomId}`
    this.ws = new WebSocket(url)
    this.ws.binaryType = 'arraybuffer'
    this.wsAccessor = this.ws

    this.ws.onopen = () => {
      this.connected = true
      this.reconnectAttempts = 0
      this.events.emit('connection', true)

      // Send user info for presence
      this.ws!.send(
        JSON.stringify({
          type: 'userinfo',
          name: userInfo.name,
          avatar: userInfo.avatar,
          userId: userInfo.id,
        }),
      )
    }

    this.ws.onmessage = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'sync' && msg.nodes && msg.edges) {
            this.handleRemoteSync(msg.nodes, msg.edges, msg.meta)
          } else if (msg.type === 'presence') {
            this.events.emit('presence', msg.users as TeamMember[])
          }
        } catch {
          // Ignore unparseable messages
        }
      }
    }

    this.ws.onclose = () => {
      this.connected = false
      this.events.emit('connection', false)
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

  // ─── Sync: Local → Peers ────────────────────────────────────────────

  pushLocalState(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[],
    meta?: Record<string, unknown>,
  ): void {
    if (!this.connected || !this.ws || this.applyingRemote) return
    this.flushSync(nodes, edges, meta)
  }

  private flushSync(
    nodes: Node<CanvasNodeData>[],
    edges: Edge[],
    meta?: Record<string, unknown>,
  ): void {
    if (this.syncTimer) clearTimeout(this.syncTimer)
    this.syncTimer = setTimeout(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
      this.ws.send(
        JSON.stringify({
          type: 'sync',
          nodes: nodes.map(serializeNode),
          edges: edges.map(serializeEdge),
          meta: meta ?? {},
        }),
      )
    }, 100)
  }

  // ─── Sync: Remote → canvasStore ─────────────────────────────────────

  private handleRemoteSync(
    rawNodes: Record<string, unknown>[],
    rawEdges: Record<string, unknown>[],
    meta: Record<string, unknown>,
  ): void {
    this.applyingRemote = true
    const nodes = rawNodes.map(deserializeNode)
    const edges = rawEdges.map(deserializeEdge)
    this.events.emit('sync', nodes, edges, meta)
    this.applyingRemote = false
  }

  // ─── Awareness (cursor, selection) ──────────────────────────────────

  sendAwareness(payload: Record<string, unknown>): void {
    if (!this.connected || !this.ws) return
    this.ws.send(JSON.stringify({ type: 'awareness', ...payload }))
  }

  // ─── Callbacks ──────────────────────────────────────────────────────

  onSync(cb: SyncDocCallback): void {
    this.events.on('sync', cb)
  }

  onPresence(cb: PresenceCallback): void {
    this.events.on('presence', cb)
  }

  onConnection(cb: ConnectionCallback): void {
    this.events.on('connection', cb)
  }

  // ─── Utility ────────────────────────────────────────────────────────

  isConnected(): boolean {
    return this.connected
  }

  /** @deprecated Yjs Doc no longer available — returns null */
  getDoc(): null {
    return null
  }
}

export const yjsBridge = new NativeEventBus()
