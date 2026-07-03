package com.cloudbuilder.shared.collaboration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * RealtimeGatewayHandler: WebSocket handler for real-time collaboration.
 *
 * Protocol (JSON over WebSocket):
 *   Client → Server:
 *     { type: "userinfo", name, avatar, userId }
 *     { type: "sync", nodes: [...], edges: [...], meta: {...} }
 *     { type: "awareness", cursor: {x,y} | null, userId }
 *   Server → Client:
 *     { type: "presence", users: [{id, name, status}] }
 *     { type: "sync", nodes: [...], edges: [...], meta: {...} }
 *     { type: "awareness", cursor, userId, userName }
 */
@Component
public class RealtimeGatewayHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(RealtimeGatewayHandler.class);

    private final CollaborationSessionManager sessionManager;

    public RealtimeGatewayHandler(CollaborationSessionManager sessionManager) {
        this.sessionManager = sessionManager;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String roomId = extractRoomId(session);
        if (roomId == null) {
            session.close(CloseStatus.NOT_ACCEPTABLE);
            return;
        }
        sessionManager.joinRoom(roomId, session);
        log.info("WebSocket connected: session={} room={}", session.getId(), roomId);

        // Broadcast updated presence to all users in the room
        sessionManager.broadcastPresence(roomId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String roomId = sessionManager.getRoomId(session.getId());
        if (roomId == null) return;

        String payload = message.getPayload();

        // Route message based on type
        if (payload.contains("\"type\":\"userinfo\"")) {
            handleUserInfo(session, payload);
        } else if (payload.contains("\"type\":\"sync\"")) {
            handleSync(session, roomId, payload);
        } else if (payload.contains("\"type\":\"awareness\"")) {
            handleAwareness(session, roomId, payload);
        }
    }

    private void handleUserInfo(WebSocketSession session, String payload) {
        // Extract name from JSON: {"type":"userinfo","name":"...","avatar":"...","userId":"..."}
        String name = extractJsonString(payload, "name");
        if (name != null && !name.isEmpty()) {
            sessionManager.setUserName(session.getId(), name);
            String roomId = sessionManager.getRoomId(session.getId());
            if (roomId != null) {
                sessionManager.broadcastPresence(roomId);
            }
        }
    }

    private void handleSync(WebSocketSession session, String roomId, String payload) {
        // Broadcast sync to all OTHER users in the room (excluding sender)
        sessionManager.broadcastToRoom(roomId, session, payload);
    }

    private void handleAwareness(WebSocketSession session, String roomId, String payload) {
        // Inject userName into the awareness message before broadcasting
        String userName = sessionManager.getUserName(session.getId());
        String enriched = injectUserName(payload, userName);
        // Broadcast awareness (cursor positions) to all OTHER users
        sessionManager.broadcastToRoom(roomId, session, enriched);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String roomId = sessionManager.getRoomId(session.getId());
        sessionManager.leaveRoom(session);
        if (roomId != null) {
            log.info("WebSocket disconnected: session={} room={}", session.getId(), roomId);
            sessionManager.broadcastPresence(roomId);
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.warn("WebSocket transport error: session={}", session.getId(), exception);
        String roomId = sessionManager.getRoomId(session.getId());
        sessionManager.leaveRoom(session);
        if (roomId != null) {
            sessionManager.broadcastPresence(roomId);
        }
    }

    private String extractRoomId(WebSocketSession session) {
        try {
            var uri = UriComponentsBuilder.fromUri(session.getUri()).build();
            var variables = uri.getPathSegments();

            // URL pattern: /ws/{roomId} or /ws?roomId=xxx
            if (variables.size() >= 2) {
                return variables.get(1);
            }

            // Fallback: check query parameter ?roomId=xxx
            String queryRoomId = uri.getQueryParams().getFirst("roomId");
            if (queryRoomId != null && !queryRoomId.isBlank()) {
                return queryRoomId;
            }

            // Default room for connections without explicit roomId
            return "default";
        } catch (Exception e) {
            log.error("Failed to extract roomId from session URI", e);
        }
        return "default";
    }

    /**
     * Extract a string value from a flat JSON object.
     * Simple extraction without Jackson dependency for performance.
     */
    private String extractJsonString(String json, String key) {
        String search = "\"" + key + "\":\"";
        int start = json.indexOf(search);
        if (start == -1) return null;
        start += search.length();
        int end = json.indexOf("\"", start);
        if (end == -1) return null;
        return json.substring(start, end);
    }

    private String injectUserName(String json, String userName) {
        // Add "userName":"..." before the closing }
        if (json.endsWith("}")) {
            return json.substring(0, json.length() - 1)
                    + ",\"userName\":\"" + userName.replace("\"", "\\\"") + "\"}";
        }
        return json;
    }
}
