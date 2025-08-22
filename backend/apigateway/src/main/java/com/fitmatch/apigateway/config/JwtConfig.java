package com.fitmatch.apigateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Configuration
public class JwtConfig {

    @Bean
    public ReactiveJwtDecoder jwtDecoder(
            @Value("${security.jwt.secret}") String secret,
            @Value("${security.jwt.base64:true}") boolean base64
    ) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                "JWT secret not provided. Set JWT_SECRET env or security.jwt.secret property.");
        }

        // 你的密钥看起来是 Base64；若改为明文，把 security.jwt.base64 设为 false 即可
        byte[] keyBytes = base64
                ? Base64.getDecoder().decode(secret)
                : secret.getBytes(StandardCharsets.UTF_8);

        SecretKeySpec key = new SecretKeySpec(keyBytes, "HmacSHA256");

        // 显式指定 HS256（更安全也更直观）
        return NimbusReactiveJwtDecoder
                .withSecretKey(key)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
    }
}