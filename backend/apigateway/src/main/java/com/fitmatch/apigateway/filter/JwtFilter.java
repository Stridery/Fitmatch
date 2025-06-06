package com.fitmatch.apigateway.filter;

import reactor.core.publisher.Mono;
import com.fitmatch.apigateway.security.JwtService;
import org.springframework.cloud.gateway.filter.*;
import org.springframework.cloud.gateway.filter.factory.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.*;

@Component

public class JwtFilter extends AbstractGatewayFilterFactory<JwtFilter.Config> {

    private final JwtService jwtService;

    public JwtFilter(JwtService jwtService) {
        super(Config.class);  // ✅ 这是关键！让 Spring Cloud 正确识别 config 类型
        this.jwtService = jwtService;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return this.onError(exchange, "Missing or invalid Authorization header", HttpStatus.UNAUTHORIZED);
            }

            String token = authHeader.substring(7);

            if (!jwtService.isTokenValid(token)) {
                return this.onError(exchange, "Invalid JWT token", HttpStatus.UNAUTHORIZED);
            }

            // 如果合法，提取用户信息并添加到 Header
            String userId = jwtService.extractUserId(token);
            String role = jwtService.extractRole(token);

            return chain.filter(
                exchange.mutate()
                        .request(builder -> builder
                                .header("X-User-Id", userId)
                                .header("X-User-Role", role)
                        )
                        .build()
            );
        };
    }

    private Mono<Void> onError(ServerWebExchange exchange, String msg, HttpStatus status) {
        exchange.getResponse().setStatusCode(status);
        return exchange.getResponse().setComplete();
    }

    public static class Config {
    }
}