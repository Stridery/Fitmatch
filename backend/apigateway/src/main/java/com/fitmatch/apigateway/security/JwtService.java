package com.fitmatch.apigateway.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.*;

@Service
public class JwtService {

    @Value("${fitmatch.jwt.secret}")
    private String secret;

    public boolean isTokenValid(String token) {
        try {
            getClaims(token); // 如果能成功解析就合法
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String extractUserId(String token) {
        return getClaims(token).getSubject(); // subject 存 userId
    }

    public String extractRole(String token) {
        return (String) getClaims(token).get("role"); // role 自定义字段
    }

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }
}