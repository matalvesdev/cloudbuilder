package com.cloudbuilder.shared.collaboration;

import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@ConditionalOnProperty(
    name = "cloudbuilder.collaboration.embedded.enabled",
    havingValue = "true"
)
public class WebSocketConfig implements WebSocketConfigurer {

    private final RealtimeGatewayHandler gatewayHandler;

    public WebSocketConfig(RealtimeGatewayHandler gatewayHandler) {
        this.gatewayHandler = gatewayHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(gatewayHandler, "/ws", "/ws/{roomId}")
                .setAllowedOrigins();
    }
}
