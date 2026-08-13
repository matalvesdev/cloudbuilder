package collaboration

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 1 * 1024 * 1024
	sendBufferSize = 256
)

// MessageType indicates the kind of WebSocket message.
type MessageType int

const (
	MessageBinary MessageType = iota
	MessageJSON
)

// Message sent over the internal channel between read/write goroutines.
type Message struct {
	Type MessageType
	Data []byte
}

// UserInfo holds public profile data broadcast to peers.
type UserInfo struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Avatar string `json:"avatar"`
	Status string `json:"status"`
}

// Client represents a single WebSocket connection.
type Client struct {
	ID       string
	TenantID string
	Roles    []string
	CanEdit  bool
	User     UserInfo

	conn       *websocket.Conn
	server     *Server
	room       *Room
	send       chan Message
	peerClosed chan struct{}
	done       chan struct{}
}

// readPump reads messages from the WebSocket connection and processes
// Yjs sync protocol (binary) and awareness/presence (JSON).
func (c *Client) readPump() {
	defer func() { c.disconnect() }()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		messageType, data, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				log.Printf("[client %s] read error: %v", c.ID, err)
			}
			break
		}

		switch messageType {
		case websocket.BinaryMessage:
			// Yjs sync/update binary → relay to all other peers in room
			if c.room != nil && c.CanEdit {
				c.room.BroadcastBinary(c, data)
			}

		case websocket.TextMessage:
			c.handleJSONMessage(data)
		}
	}
}

func (c *Client) handleJSONMessage(data []byte) {
	var msg struct {
		Type string `json:"type"`
	}
	if err := json.Unmarshal(data, &msg); err != nil {
		if c.room != nil {
			c.room.BroadcastJSONExcept(c, data)
		}
		return
	}

	switch msg.Type {
	case "awareness":
		// Relay cursor, selection, viewport to other peers
		if c.room != nil {
			c.room.BroadcastJSONExcept(c, data)
		}

	case "userinfo":
		var info struct {
			Name   string `json:"name"`
			Avatar string `json:"avatar"`
		}
		if json.Unmarshal(data, &info) == nil {
			if info.Avatar != "" {
				c.User.Avatar = info.Avatar
			}
		}
		if c.room != nil {
			presence, _ := json.Marshal(map[string]interface{}{
				"type":  "presence",
				"users": c.room.PresenceList(),
			})
			c.room.BroadcastJSON(presence)
		}

	case "sync":
		if c.room != nil && c.CanEdit {
			c.room.BroadcastJSONExcept(c, data)
		}

	default:
		log.Printf("[client %s] dropped unsupported message type %q", c.ID, msg.Type)
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			var err error
			switch message.Type {
			case MessageBinary:
				err = c.conn.WriteMessage(websocket.BinaryMessage, message.Data)
			case MessageJSON:
				err = c.conn.WriteMessage(websocket.TextMessage, message.Data)
			}
			if err != nil {
				log.Printf("[client %s] write error: %v", c.ID, err)
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}

		case <-c.done:
			return
		}
	}
}

func (c *Client) disconnect() {
	if c.room != nil {
		c.room.RemoveClient(c)
		if c.room.PeerCount() > 0 {
			presence, _ := json.Marshal(map[string]interface{}{
				"type":  "presence",
				"users": c.room.PresenceList(),
			})
			c.room.BroadcastJSON(presence)
		}
		c.room = nil
	}
	c.server.RemoveClient(c)
	close(c.done)
}
