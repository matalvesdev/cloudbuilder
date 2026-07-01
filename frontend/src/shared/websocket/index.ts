/**
 * WebSocket connection manager.
 *
 * Centralized WebSocket handling with:
 * - Auto-reconnect with exponential backoff
 * - Heartbeat keepalive
 * - Typed message dispatch
 * - Connection state management
 * - Event feed → EventBus bridge
 *
 * Architecture:
 *   Kafka → Backend WS Gateway → WebSocket Manager → EventBus → Features
 *
 * Usage:
 *   import { wsClient } from '@/shared/websocket'
 *
 *   wsClient.connect()
 *
 *   wsClient.on('deployment:started', (payload) => {
 *     eventBus.publish('deployment:started', payload)
 *   })
 *
 *   wsClient.disconnect()
 */

import { eventBus, type DomainEvents } from '@/shared/event-bus'

/* ─── Types ────────────────────────────────────────────────── */

export interface WSMessage<TPayload = Record<string, unknown>> {
  type: string
  payload: TPayload
  timestamp: string
  correlationId?: string
}

export interface WSState {
  connected: boolean
  reconnecting: boolean
  retryCount: number
  lastEventTime: number | null
}

export type WSStateListener = (state: WSState) => void
export type WSMessageHandler = (message: WSMessage) => void

/* ─── Configuration ────────────────────────────────────────── */

const BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080'
const MAX_RETRIES = 20
const RETRY_BASE_DELAY = 1000
const RETRY_MAX_DELAY = 30000
const HEARTBEAT_INTERVAL = 30000
const HEARTBEAT_TIMEOUT = 10000

/* ─── WebSocket Client ─────────────────────────────────────── */

class WebSocketClient {
  private ws: WebSocket | null = null
  private state: WSState = {
    connected: false,
    reconnecting: false,
    retryCount: 0,
    lastEventTime: null,
  }

  private stateListeners = new Set<WSStateListener>()
  private messageHandlers = new Map<string, Set<WSMessageHandler>>()
  private globalHandlers = new Set<WSMessageHandler>()
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private heartbeatTimeoutTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private shouldReconnect = true

  /**
   * Connect to the WebSocket server.
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return

    this.shouldReconnect = true
    const token = localStorage.getItem('cloudbuilder-auth-token')
    const url = token ? `${BASE_URL}/ws?token=${token}` : `${BASE_URL}/ws`

    try {
      this.ws = new WebSocket(url)
      this.ws.onopen = this.handleOpen.bind(this)
      this.ws.onmessage = this.handleMessage.bind(this)
      this.ws.onclose = this.handleClose.bind(this)
      this.ws.onerror = this.handleError.bind(this)
    } catch (err) {
      console.error('[WebSocket] Connection error:', err)
      this.scheduleReconnect()
    }
  }

  /**
   * Disconnect and stop reconnecting.
   */
  disconnect(): void {
    this.shouldReconnect = false
    this.clearTimers()

    if (this.ws) {
      this.ws.onclose = null // prevent reconnect logic
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }

    this.updateState({ connected: false, reconnecting: false, retryCount: 0 })
  }

  /**
   * Subscribe to a specific message type.
   * Returns unsubscribe function.
   */
  on<TPayload>(type: string, handler: (payload: TPayload) => void): () => void {
    const typedHandler: WSMessageHandler = (msg) => {
      if (msg.type === type) {
        handler(msg.payload as TPayload)
      }
    }

    const handlers = this.messageHandlers.get(type) ?? new Set()
    handlers.add(typedHandler)
    this.messageHandlers.set(type, handlers)

    return () => {
      handlers.delete(typedHandler)
      if (handlers.size === 0) this.messageHandlers.delete(type)
    }
  }

  /**
   * Subscribe to ALL messages (global handler).
   * Returns unsubscribe function.
   */
  onMessage(handler: WSMessageHandler): () => void {
    this.globalHandlers.add(handler)
    return () => this.globalHandlers.delete(handler)
  }

  /**
   * Subscribe to connection state changes.
   * Returns unsubscribe function.
   */
  onStateChange(listener: WSStateListener): () => void {
    this.stateListeners.add(listener)
    return () => this.stateListeners.delete(listener)
  }

  /**
   * Get current connection state.
   */
  getState(): WSState {
    return { ...this.state }
  }

  /**
   * Send a message to the server.
   */
  send(type: string, payload: Record<string, unknown>): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Cannot send — not connected')
      return
    }

    this.ws.send(JSON.stringify({ type, payload, timestamp: new Date().toISOString() }))
  }

  /**
   * Bridge: automatically publish received WebSocket events to the EventBus.
   * Filters by allowed topic prefixes to prevent noise and internal messages.
   * Call this once after connect() to wire up the event pipeline.
   *
   * @param allowedPrefixes - Optional filter: only events matching these prefixes are bridged.
   *   Defaults to all domain event prefixes (deployment, drift, cost, incident, canvas, etc.).
   */
  bridgeToEventBus(allowedPrefixes?: string[]): void {
    // Default: bridge all known domain event prefixes
    const prefixes = allowedPrefixes ?? [
      'deployment:', 'drift:', 'cost:', 'incident:',
      'canvas:', 'provision:', 'observe:', 'notification:',
      'auth:', 'flags:', 'security:', 'audit:',
    ]

    // Skip internal message types
    const skipTypes = new Set(['ping', 'pong', 'system:heartbeat'])

    this.onMessage((message) => {
      // Skip internal/heartbeat messages
      if (skipTypes.has(message.type)) return

      // Filter by allowed prefixes
      const matchesPrefix = prefixes.some((p) => message.type.startsWith(p))
      if (!matchesPrefix) return

      // Publish to EventBus as a domain event
      const eventType = message.type as string & keyof DomainEvents
      eventBus.publish(eventType, message.payload as DomainEvents[typeof eventType])
    })
  }

  /* ─── Internal Handlers ────────────────────────────────── */

  private handleOpen(): void {
    this.updateState({ connected: true, reconnecting: false, retryCount: 0 })
    this.startHeartbeat()
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WSMessage = JSON.parse(event.data)

      // Heartbeat pong — ignore
      if (message.type === 'pong') {
        this.clearHeartbeatTimeout()
        return
      }

      this.updateState({ lastEventTime: Date.now() })

      // Dispatch to type-specific handlers
      const typeHandlers = this.messageHandlers.get(message.type)
      if (typeHandlers) {
        for (const handler of typeHandlers) {
          try {
            handler(message)
          } catch (err) {
            console.error(`[WebSocket] Handler error for "${message.type}":`, err)
          }
        }
      }

      // Dispatch to global handlers
      for (const handler of this.globalHandlers) {
        try {
          handler(message)
        } catch (err) {
          console.error('[WebSocket] Global handler error:', err)
        }
      }
    } catch (err) {
      console.error('[WebSocket] Failed to parse message:', err)
    }
  }

  private handleClose(event: CloseEvent): void {
    this.updateState({ connected: false })
    this.stopHeartbeat()

    if (this.shouldReconnect && event.code !== 1000) {
      this.scheduleReconnect()
    }
  }

  private handleError(event: Event): void {
    console.error('[WebSocket] Error:', event)
  }

  /* ─── Reconnection ─────────────────────────────────────── */

  private scheduleReconnect(): void {
    if (this.state.retryCount >= MAX_RETRIES) {
      console.error('[WebSocket] Max retries reached — giving up')
      this.updateState({ reconnecting: false })
      return
    }

    this.updateState({ reconnecting: true })
    const delay = Math.min(
      RETRY_BASE_DELAY * Math.pow(2, this.state.retryCount),
      RETRY_MAX_DELAY
    )

    this.reconnectTimer = setTimeout(() => {
      this.updateState({ retryCount: this.state.retryCount + 1 })
      this.connect()
    }, delay)
  }

  /* ─── Heartbeat ─────────────────────────────────────────── */

  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }))
        this.scheduleHeartbeatTimeout()
      }
    }, HEARTBEAT_INTERVAL)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    this.clearHeartbeatTimeout()
  }

  private scheduleHeartbeatTimeout(): void {
    this.clearHeartbeatTimeout()
    this.heartbeatTimeoutTimer = setTimeout(() => {
      console.warn('[WebSocket] Heartbeat timeout — reconnecting')
      this.ws?.close(4001, 'Heartbeat timeout')
    }, HEARTBEAT_TIMEOUT)
  }

  private clearHeartbeatTimeout(): void {
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer)
      this.heartbeatTimeoutTimer = null
    }
  }

  /* ─── State Management ──────────────────────────────────── */

  private updateState(partial: Partial<WSState>): void {
    this.state = { ...this.state, ...partial }
    for (const listener of this.stateListeners) {
      try {
        listener(this.state)
      } catch (err) {
        console.error('[WebSocket] State listener error:', err)
      }
    }
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.stopHeartbeat()
  }
}

/** Singleton WebSocket client */
export const wsClient = new WebSocketClient()
