package collaboration

import (
	"log"
	"sync"
)

// Room represents a collaborative session tied to a canvas ID.
type Room struct {
	id      string
	clients map[*Client]bool
	mu      sync.RWMutex
}

// NewRoom creates a new room.
func NewRoom(id string) *Room {
	return &Room{
		id:      id,
		clients: make(map[*Client]bool),
	}
}

// AddClient registers a client in the room.
func (r *Room) AddClient(c *Client) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.clients[c] = true
	log.Printf("[room %s] client %s joined (%d total)", r.id, c.ID, len(r.clients))
}

// RemoveClient unregisters a client from the room and closes their peer channel.
func (r *Room) RemoveClient(c *Client) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.clients[c]; ok {
		delete(r.clients, c)
		close(c.peerClosed)
		log.Printf("[room %s] client %s left (%d remaining)", r.id, c.ID, len(r.clients))
	}
}

// BroadcastBinary sends a binary message to all other peers in the room.
// Used to relay Yjs sync updates between clients.
func (r *Room) BroadcastBinary(sender *Client, data []byte) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for client := range r.clients {
		if client != sender {
			select {
			case client.send <- Message{Type: MessageBinary, Data: data}:
			default:
				// Client send buffer full; skip.
			}
		}
	}
}

// BroadcastJSON sends a JSON message to all clients in the room including sender.
// Used for awareness, cursors, and system broadcasts.
func (r *Room) BroadcastJSON(data []byte) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for client := range r.clients {
		select {
		case client.send <- Message{Type: MessageJSON, Data: data}:
		default:
		}
	}
}

// BroadcastJSONExcept sends a JSON message to all clients except the sender.
func (r *Room) BroadcastJSONExcept(sender *Client, data []byte) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for client := range r.clients {
		if client != sender {
			select {
			case client.send <- Message{Type: MessageJSON, Data: data}:
			default:
			}
		}
	}
}

// PeerCount returns the number of connected clients.
func (r *Room) PeerCount() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.clients)
}

// PresenceList returns a snapshot of connected users for broadcasting.
func (r *Room) PresenceList() []UserInfo {
	r.mu.RLock()
	defer r.mu.RUnlock()
	list := make([]UserInfo, 0, len(r.clients))
	for c := range r.clients {
		list = append(list, c.User)
	}
	return list
}
