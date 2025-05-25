package com.fitmatch.authservice.service;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.UUID;


@Service
public class JwtService {

    @Value("${fitmatch.jwt.secret}")
    private String secret;

    @Value("${fitmatch.jwt.expire-days:7}")
    private int expireDays;

    private Key key;

    @PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
    }

    // 生成 JWT
    public String generateToken(UUID userId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expireDays * 86400000L); // 天 → 毫秒

        return Jwts.builder()
                .setSubject(userId.toString())
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }
     
    public String generateTokenWithEmail(String email) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + 10 * 60 * 1000); // 10分钟有效
    
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .claim("type", "register") // 可选：标注 token 用途
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }
    

    // 解析 JWT，返回 userId
    public UUID parseToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            return UUID.fromString(claims.getSubject());
        } catch (JwtException e) {
            throw new RuntimeException("无效的 token", e);
        }
    }

    
}
