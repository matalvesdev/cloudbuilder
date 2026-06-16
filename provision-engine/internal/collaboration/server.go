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
	addr     string
	upgrader websocket.Upgrader

	mu      sync.RWMutex
	rooms   map[string]*Room
	clients map[*Client]bool
}

// NewServer creates a new collaboration WebSocket server.
func NewServer(addr string) *Server {
	return &Server{
		addr: addr,
		upgrader: websocket.Upgrader{
			ReadBufferSize:  4096,
			WriteBufferSize: 4096,
			CheckOrigin: func(r *http.Request) bool {
				return true // Allow all origins in dev
			},
		},
		rooms:   make(map[string]*Room),
		clients: make(map[*Client]bool),
	}
}

// Start begins listening for WebSocket connections.
func (s *Server) Start() error {
	mux := http.NewServeMux()
	mux.HandleFunc("/ws/", s.handleWebSocket) // Path-based room: /ws/{roomId}
	mux.HandleFunc("/health", s.handleHealth)

	log.Printf("[collaboration] WebSocket server starting on %s/ws/{roomId}", s.addr)
	return http.ListenAndServe(s.addr, mux)
}

// handleWebSocket upgrades HTTP to WebSocket with path-based room id.
// Path format: /ws/{roomId} — e.g. /ws/canvas:abc123
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

	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[collaboration] upgrade error: %v", err)
		return
	}

	clientID := generateID()
	client := &Client{
		ID: clientID,
		User: UserInfo{
			ID:     clientID,
			Name:   fmt.Sprintf("User-%s", clientID[:6]),
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

	log.Printf("[collaboration] client %s connected to room %s from %s", clientID, roomID, r.RemoteAddr)

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
