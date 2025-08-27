package com.fitmatch.userservice.service;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.fitmatch.userservice.dto.UserProfileRequest;
import com.fitmatch.userservice.dto.UserProfileResponse;
import com.fitmatch.userservice.dto.PublicUserDto;
import com.fitmatch.userservice.entity.UserProfile;
import com.fitmatch.userservice.exception.ConflictException;
import com.fitmatch.userservice.repository.UserProfileRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserProfileRepository userProfileRepository;

    public void saveOrUpdateProfile(UserProfileRequest request, String userIdString){
        UUID userId;
        try{
            userId = UUID.fromString(userIdString);
        }
        catch(IllegalArgumentException e){
            throw new ConflictException("Invalid user ID format");
        }
        
        Optional<UserProfile> optional = userProfileRepository.findByUserId(userId);

        UserProfile profile = optional.orElseGet(() -> {
            UserProfile newProfile = new UserProfile();
            //newProfile.setId(UUID.randomUUID());  // 手动生成 UUID，也可以靠 @GeneratedValue 自动生成
            newProfile.setUserId(userId);
            return newProfile;
        });

        // 必填字段
        profile.setNickname(request.getNickname());

        profile.setAvatarUrl(request.getAvatarUrl());
        profile.setIsFor(request.getIsFor());
        profile.setGender(request.getGender());
        profile.setBirthday(request.getBirthday());
        profile.setCountry(request.getCountry());
        profile.setCity(request.getCity());

        // 选填字段
        profile.setPhone(request.getPhone());
        profile.setMbtiType(request.getMbtiType());
        profile.setBehavioralAnswers(request.getBehavioralAnswers());
        profile.setHeightCm(request.getHeightCm());
        profile.setWeightKg(request.getWeightKg());
        profile.setCurrentTrainingFrequency(request.getCurrentTrainingFrequency());
        profile.setIsCoach(request.isCoach());
        profile.setIsVenue(request.isVenue());

        profile.setUpdatedAt(Timestamp.from(Instant.now()));

        System.out.println("Saving UserProfile: " + profile);


        userProfileRepository.save(profile);
    }

    public void deleteUserProfile(String userIdStr){
        UUID userId;
        try {
            userId = UUID.fromString(userIdStr);
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid user ID format");
        }

        Optional<UserProfile> profileOpt = userProfileRepository.findByUserId(userId);
        if (profileOpt.isEmpty()) {
            throw new ConflictException("User profile not found");
        }

        userProfileRepository.delete(profileOpt.get());
    }

    public UserProfileResponse getUserProfile(String userIdStr) {
        UUID userId;
        try {
            userId = UUID.fromString(userIdStr);
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid user ID format");
        }
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ConflictException("User profile not found"));

        return mapToResponse(profile);
    }

    private UserProfileResponse mapToResponse(UserProfile entity) {
    return UserProfileResponse.builder()
            .avatarUrl(entity.getAvatarUrl())
            .nickname(entity.getNickname())
            .phone(entity.getPhone())
            .isFor(entity.getIsFor())
            .gender(entity.getGender())
            .birthday(entity.getBirthday())
            .country(entity.getCountry())
            .city(entity.getCity())
            .mbtiType(entity.getMbtiType())
            .behavioralAnswers(entity.getBehavioralAnswers())
            .heightCm(entity.getHeightCm())
            .weightKg(entity.getWeightKg())
            .currentTrainingFrequency(entity.getCurrentTrainingFrequency())
            .updatedAt(entity.getUpdatedAt())
            .isCoach(entity.getIsCoach())
            .isVenue(entity.getIsVenue())
            .build();
}

    public List<PublicUserDto> searchUsersByNickname(String q, int limit) {
        if (q == null || q.trim().length() < 2) {
            return java.util.Collections.emptyList();
        }
        String keyword = q.trim();
        List<UserProfile> found = userProfileRepository.findByNicknameContainingIgnoreCase(keyword);
        return found.stream()
            .limit(Math.max(1, Math.min(limit, 50)))
            .map(u -> PublicUserDto.builder()
                    .id(u.getUserId().toString())
                    .nickname(u.getNickname())
                    .avatarUrl(u.getAvatarUrl())
                    .build())
            .collect(Collectors.toList());
    }
}