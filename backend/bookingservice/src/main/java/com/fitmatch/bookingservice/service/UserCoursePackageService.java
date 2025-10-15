package com.fitmatch.bookingservice.service;

import com.fitmatch.bookingservice.dto.*;
import com.fitmatch.bookingservice.entity.UserCoursePackage;
import com.fitmatch.bookingservice.repository.UserCoursePackageRepository;
import com.fitmatch.bookingservice.service.CourseServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserCoursePackageService {
    
    private final UserCoursePackageRepository userCoursePackageRepository;
    private final CourseServiceClient courseServiceClient;
    
    /**
     * 获取用户的课包列表
     */
    public List<UserCoursePackageDto> getUserPackages(UUID userId) {
        List<UserCoursePackage> packages = userCoursePackageRepository.findByUserId(userId);
        return packages.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * 获取用户特定课程的课包
     */
    public List<UserCoursePackageDto> getUserPackagesByCourse(UUID userId, UUID courseId) {
        List<UserCoursePackage> packages = userCoursePackageRepository.findByUserId(userId);
        return packages.stream()
                .filter(pkg -> pkg.getCourseId().equals(courseId))
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * 购买课包（模拟实现）
     */
    @Transactional
    public PurchasePackageResponse purchasePackage(UUID userId, PurchasePackageRequest request) {
        try {
            log.info("User {} purchasing package {}", userId, request.getPackagePriceId());
            
            // 从course service获取真实的套餐价格信息
            CoursePackagePriceDto packagePrice = courseServiceClient.getPackagePrice(request.getPackagePriceId());
            int lessonsCount = packagePrice.getLessonsCount();
            log.info("Package {} has {} lessons", request.getPackagePriceId(), lessonsCount);
            
            // 检查用户是否已经有这个套餐
            UserCoursePackage existingPackage = userCoursePackageRepository
                    .findByUserIdAndPackagePriceId(userId, request.getPackagePriceId())
                    .orElse(null);
            
            if (existingPackage != null) {
                // 如果已有套餐，增加次数
                existingPackage.setTotalCredits(existingPackage.getTotalCredits() + lessonsCount);
                existingPackage.setRemainingCredits(existingPackage.getRemainingCredits() + lessonsCount);
                existingPackage.setStatus(UserCoursePackage.PackageStatus.ACTIVE);
                existingPackage.setUpdatedAt(LocalDateTime.now());
                
                userCoursePackageRepository.save(existingPackage);
                
                log.info("Updated existing package {} for user {}", existingPackage.getId(), userId);
                return PurchasePackageResponse.success(existingPackage.getId());
            } else {
                // 创建新的课包
                UserCoursePackage newPackage = new UserCoursePackage();
                newPackage.setUserId(userId);
                newPackage.setCoachId(request.getCoachId());
                newPackage.setCourseId(request.getCourseId());
                newPackage.setPackagePriceId(request.getPackagePriceId());
                newPackage.setTotalCredits(lessonsCount);
                newPackage.setRemainingCredits(lessonsCount);
                newPackage.setStatus(UserCoursePackage.PackageStatus.ACTIVE);
                newPackage.setExpiresAt(LocalDateTime.now().plusMonths(12)); // 默认1年有效期
                newPackage.setNote("Purchased package");
                
                UserCoursePackage savedPackage = userCoursePackageRepository.save(newPackage);
                
                log.info("Created new package {} for user {} with {} credits", 
                    savedPackage.getId(), userId, savedPackage.getTotalCredits());
                return PurchasePackageResponse.success(savedPackage.getId());
            }
            
        } catch (Exception e) {
            log.error("Error purchasing package for user {}: {}", userId, e.getMessage(), e);
            return PurchasePackageResponse.failure("Failed to purchase package: " + e.getMessage());
        }
    }
    
    /**
     * 使用课包次数
     */
    @Transactional
    public boolean usePackageCredits(UUID packageId, int credits) {
        try {
            UserCoursePackage userPackage = userCoursePackageRepository.findById(packageId)
                    .orElseThrow(() -> new RuntimeException("Package not found"));
            
            if (userPackage.getRemainingCredits() < credits) {
                throw new RuntimeException("Insufficient credits");
            }
            
            userPackage.setRemainingCredits(userPackage.getRemainingCredits() - credits);
            userPackage.setUpdatedAt(LocalDateTime.now());
            
            userCoursePackageRepository.save(userPackage);
            
            log.info("Used {} credits from package {}, remaining: {}", 
                    credits, packageId, userPackage.getRemainingCredits());
            return true;
            
        } catch (Exception e) {
            log.error("Error using package credits: {}", e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * 转换为DTO
     */
    private UserCoursePackageDto convertToDto(UserCoursePackage entity) {
        UserCoursePackageDto dto = new UserCoursePackageDto();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUserId());
        dto.setCoachId(entity.getCoachId());
        dto.setCourseId(entity.getCourseId());
        dto.setPackagePriceId(entity.getPackagePriceId());
        dto.setTotalCredits(entity.getTotalCredits());
        dto.setRemainingCredits(entity.getRemainingCredits());
        dto.setStatus(entity.getStatus().name());
        dto.setExpiresAt(entity.getExpiresAt());
        dto.setNote(entity.getNote());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}
