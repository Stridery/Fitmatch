package com.fitmatch.authservice.repository;

import com.fitmatch.authservice.entity.OAuthAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OAuthAccountRepository extends JpaRepository<OAuthAccount, UUID> {

    // 根据 provider 和平台用户 ID 查询绑定
    Optional<OAuthAccount> findByProviderAndOauthId(String provider, String oauthId);

    Optional<OAuthAccount> findByEmail(String email); // 查的是 oauth_accounts.email
}