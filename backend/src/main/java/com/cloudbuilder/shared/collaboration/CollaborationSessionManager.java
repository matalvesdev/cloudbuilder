package com.cloudbuilder.shared.collaboration;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * Manages WebSocket collaboration rooms.
 * Each room (identified by roomId) holds a set of active sessions.
 */
@Component
public class CollaborationSessionManager {

    private final Map<String, Set<WebSocketSession>> rooms = new ConcurrentHashMap<>();
    private final Map<String, String> sessionUserNames = new ConcurrentHashMap<>();
    private final Map<String, String> sessionRoomIds = new ConcurrentHashMap<>();

    public void joinRoom(String roomId, WebSocketSession session) {
        rooms.computeIfAbsent(roomId, k -> new CopyOnWriteArraySet<>()).add(session);
        sessionRoomIds.put(session.getId(), roomId);
    }

    public void leaveRoom(WebSocketSession session) {
        String roomId = sessionRoomIds.remove(session.getId());
        if (roomId != null) {
            Set<WebSocketSession> room = rooms.get(roomId);
            if (room != null) {
                room.remove(session);
                if (room.isEmpty()) {
                    rooms.remove(roomId);
                }
            }
        }
        sessionUserNames.remove(session.getId());
    }

    public void setUserName(String sessionId, String name) {
        sessionUserNames.put(sessionId, name);
    }

    public String getUserName(String sessionId) {
        return sessionUserNames.getOrDefault(sessionId, "User");
    }

    public String getRoomId(String sessionId) {
        return sessionRoomIds.get(sessionId);
    }

    /**
     * Broadcast a message to all sessions in the room except the sender.
     */
    public void broadcastToRoom(String roomId, WebSocketSession sender, String message) {
        Set<WebSocketSession> room = rooms.get(roomId);
        if (room == null) return;

        for (WebSocketSession session : room) {
            if (session.equals(sender)) continue;
            if (session.isOpen()) {
                try {
                    synchronized (session) {
                        session.sendMessage(new org.springframework.web.socket.TextMessage(message));
                    }
                } catch (IOException e) {
                    // Session will be cleaned up on close
                }
            }
        }
    }

    /**
     * Broadcast a message to all sessions in the room including the sender.
     */
    public void broadcastToAll(String roomId, String message) {
        Set<WebSocketSession> room = rooms.get(roomId);
        if (room == null) return;

        for (WebSocketSession session : room) {
            if (session.isOpen()) {
                try {
                    synchronized (session) {
                        session.sendMessage(new org.springframework.web.socket.TextMessage(message));
                    }
                } catch (IOException e) {
                    // Session will be cleaned up on close
                }
            }
        }
    }

    /**
     * Build and broadcast the current presence list for a room.
     */
    public void broadcastPresence(String roomId) {
        Set<WebSocketSession> room = rooms.get(roomId);
        if (room == null) return;

        StringBuilder sb = new StringBuilder("{\"type\":\"presence\",\"users\":[");
        boolean first = true;
        for (WebSocketSession session : room) {
            if (!session.isOpen()) continue;
            String name = getUserName(session.getId());
            if (!first) sb.append(",");
            sb.append("{\"id\":\"").append(session.getId())
              .append("\",\"name\":\"").append(escapeJson(name))
              .append("\",\"status\":\"online\"}");
            first = false;
        }
        sb.append("]}");
        broadcastToAll(roomId, sb.toString());
    }

    public int getRoomSize(String roomId) {
        Set<WebSocketSession> room = rooms.get(roomId);
        return room == null ? 0 : room.size();
    }

    private String escapeJson(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
