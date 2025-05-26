package com.fitmatch.authservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;





@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(unique = true)
    private String email;

    @Column
    private String password;

    @Column
    private String nickname;

    @Column
    private String role; // STUDENT or COACH

    @Builder.Default
    private Boolean emailVerified = false;

    @CreationTimestamp
    private LocalDateTime createdAt;

    // === OAuth 关联表（多对一）===
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OAuthAccount> oauthAccounts;
}
