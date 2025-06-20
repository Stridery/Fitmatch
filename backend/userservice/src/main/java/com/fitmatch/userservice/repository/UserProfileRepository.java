package com.fitmatch.userservice.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

import com.fitmatch.userservice.entity.UserProfile;

public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {

    // 根据 user_id 查找 profile（唯一）
    Optional<UserProfile> findByUserId(UUID userId);

    // 判断 user_id 是否存在
    boolean existsByUserId(UUID userId);

    // 删除指定 user_id 的 profile
    void deleteByUserId(UUID userId);
}