package com.fitmatch.authservice.repository;

import com.fitmatch.authservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    // 按邮箱查找（注册/登录用）
    Optional<User> findByEmail(String email);

    // 按角色查找（可选）
    Optional<User> findByIdAndRole(UUID id, String role);
}
