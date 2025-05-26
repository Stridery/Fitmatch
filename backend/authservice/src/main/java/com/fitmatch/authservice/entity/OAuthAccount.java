package com.fitmatch.authservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "user_oauth_accounts",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"provider", "oauthId"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OAuthAccount {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 50)
    private String provider; // e.g., "google", "github"

    @Column(nullable = false, length = 255)
    private String oauthId; // 用户在第三方平台的唯一 ID

    @Column(nullable = true)
    private String email;     // ✅ 第三方返回的 email，保存但不与主表绑定

    @CreationTimestamp
    private LocalDateTime createdAt;
}