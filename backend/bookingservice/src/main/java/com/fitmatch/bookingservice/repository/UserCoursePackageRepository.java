package com.fitmatch.bookingservice.repository;

import com.fitmatch.bookingservice.entity.UserCoursePackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserCoursePackageRepository extends JpaRepository<UserCoursePackage, UUID> {
    
    /**
     * 根据用户ID查找所有课包
     */
    List<UserCoursePackage> findByUserId(UUID userId);
    
    /**
     * 根据用户ID和状态查找课包
     */
    List<UserCoursePackage> findByUserIdAndStatus(UUID userId, UserCoursePackage.PackageStatus status);
    
    /**
     * 根据用户ID、教练ID和课程ID查找课包
     */
    List<UserCoursePackage> findByUserIdAndCoachIdAndCourseId(UUID userId, UUID coachId, UUID courseId);
    
    /**
     * 根据用户ID、教练ID、课程ID和状态查找课包
     */
    List<UserCoursePackage> findByUserIdAndCoachIdAndCourseIdAndStatus(
        UUID userId, UUID coachId, UUID courseId, UserCoursePackage.PackageStatus status);
    
    /**
     * 查找用户的有效课包（活跃且未过期）
     */
    @Query("SELECT ucp FROM UserCoursePackage ucp WHERE ucp.userId = :userId " +
           "AND ucp.status = 'ACTIVE' " +
           "AND (ucp.expiresAt IS NULL OR ucp.expiresAt > CURRENT_TIMESTAMP)")
    List<UserCoursePackage> findActivePackagesByUserId(@Param("userId") UUID userId);
    
    /**
     * 查找用户对特定教练和课程的有效课包
     */
    @Query("SELECT ucp FROM UserCoursePackage ucp WHERE ucp.userId = :userId " +
           "AND ucp.coachId = :coachId AND ucp.courseId = :courseId " +
           "AND ucp.status = 'ACTIVE' " +
           "AND (ucp.expiresAt IS NULL OR ucp.expiresAt > CURRENT_TIMESTAMP)")
    List<UserCoursePackage> findActivePackagesByUserAndCoachAndCourse(
        @Param("userId") UUID userId, 
        @Param("coachId") UUID coachId, 
        @Param("courseId") UUID courseId);
}
