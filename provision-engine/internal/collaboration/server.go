package collaboration

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"

	"github.com/gorilla/websocket"
)

const (
	roomIDIndex = 2 // Path segments: "" / "ws" / "{roomId}"
)

// Server manages WebSocket connections and collaborative rooms.
type Server struct {
	addr       string
	jwtSecret  []byte
	allowOrigin func(r *http.Request) bool
	upgrader   websocket.Upgrader

	mu      sync.RWMutex
	rooms   map[string]*Room
	clients map[*Client]bool
}

// NewServer creates a new collaboration WebSocket server.
// Pass jwtSecret=nil to disable authentication (dev mode).
func NewServer(addr string, opts ...ServerOption) *Server {
	s := &Server{
		addr:      addr,
		jwtSecret: nil,
		allowOrigin: func(r *http.Request) bool {
			return true // default: allow all (dev mode)
		},
		rooms:   make(map[string]*Room),
		clients: make(map[*Client]bool),
	}
	for _, opt := range opts {
		opt(s)
	}
	s.upgrader = websocket.Upgrader{
		ReadBufferSize:  4096,
		WriteBufferSize: 4096,
		CheckOrigin:     s.allowOrigin,
	}
	return s
}

// ServerOption configures the collaboration server.
type ServerOption func(*Server)

// WithJWTSecret enables JWT authentication on WebSocket connections.
func WithJWTSecret(secret []byte) ServerOption {
	return func(s *Server) {
		s.jwtSecret = secret
	}
}

// WithCheckOrigin sets a custom origin validation function.
func WithCheckOrigin(fn func(r *http.Request) bool) ServerOption {
	return func(s *Server) {
		s.allowOrigin = fn
	}
}

// Start begins listening for WebSocket connections.
func (s *Server) Start() error {
	mux := http.NewServeMux()
	mux.HandleFunc("/ws/", s.handleWebSocket) // Path-based room: /ws/{roomId}
	mux.HandleFunc("/health", s.handleHealth)

	log.Printf("[collaboration] WebSocket server starting on %s/ws/{roomId} (auth=%v)",
		s.addr, s.jwtSecret != nil)
	return http.ListenAndServe(s.addr, mux)
}

// handleWebSocket upgrades HTTP to WebSocket with path-based room id.
// Path format: /ws/{roomId} — e.g. /ws/canvas:abc123
// Authentication: JWT via ?token= query param or Authorization: Bearer header.
func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	var roomID string
	if len(parts) > roomIDIndex {
		roomID = parts[roomIDIndex]
	}
	if roomID == "" {
		http.Error(w, "missing room id in path: /ws/{roomId}", http.StatusBadRequest)
		return
	}

	// Authenticate if JWT secret is configured
	var clientID, userName, tenantID string
	var roles []string

	if s.jwtSecret != nil {
		token, err := ExtractTokenFromRequest(
			r.URL.Query().Get("token"),
			r.Header.Get("Authorization"),
		)
		if err != nil {
			http.Error(w, FormatClaimsError(err), http.StatusUnauthorized)
			return
		}

		claims, err := ValidateJWT(token, s.jwtSecret)
		if err != nil {
			http.Error(w, FormatClaimsError(err), http.StatusUnauthorized)
			return
		}

		clientID = claims.Sub
		userName = claims.Name
		tenantID = claims.TenantID
		roles = claims.Roles

		if clientID == "" {
			clientID = generateID()
		}
		if userName == "" {
			userName = fmt.Sprintf("User-%s", clientID[:min(6, len(clientID))])
		}
	} else {
		// Dev mode: no auth, generate random ID
		clientID = generateID()
		userName = fmt.Sprintf("User-%s", clientID[:6])
	}

	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[collaboration] upgrade error: %v", err)
		return
	}

	client := &Client{
		ID:       clientID,
		TenantID: tenantID,
		Roles:    roles,
		User: UserInfo{
			ID:     clientID,
			Name:   userName,
			Avatar: "U",
			Status: "online",
		},
		conn:       conn,
		server:     s,
		send:       make(chan Message, sendBufferSize),
		peerClosed: make(chan struct{}),
		done:       make(chan struct{}),
	}

	s.mu.Lock()
	s.clients[client] = true
	s.mu.Unlock()

	s.JoinRoom(client, roomID)

	log.Printf("[collaboration] client %s (%s) connected to room %s from %s",
		clientID, userName, roomID, r.RemoteAddr)

	// Broadcast presence to room
	presence, _ := json.Marshal(map[string]interface{}{
		"type":  "presence",
		"users": client.room.PresenceList(),
	})
	client.room.BroadcastJSON(presence)

	go client.writePump()
	go client.readPump()
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	s.mu.RLock()
	roomCount := len(s.rooms)
	clientCount := len(s.clients)
	s.mu.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "ok",
		"rooms":   roomCount,
		"clients": clientCount,
		"addr":    s.addr,
	})
}

// JoinRoom adds a client to a room, creating it if needed.
func (s *Server) JoinRoom(client *Client, roomID string) {
	s.mu.Lock()
	room, exists := s.rooms[roomID]
	if !exists {
		room = NewRoom(roomID)
		s.rooms[roomID] = room
		log.Printf("[collaboration] created room %s", roomID)
	}
	s.mu.Unlock()

	if client.room != nil {
		client.room.RemoveClient(client)
	}

	room.AddClient(client)
	client.room = room
}

// RemoveClient removes a client from the server registry.
func (s *Server) RemoveClient(client *Client) {
	s.mu.Lock()
	delete(s.clients, client)
	s.mu.Unlock()
	log.Printf("[collaboration] client %s disconnected", client.ID)
}

func generateID() string {
	const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz"
	b := make([]byte, 12)
	for i := range b {
		b[i] = alphabet[uint8(i*7+3)%uint8(len(alphabet))]
	}
	return string(b)
}
