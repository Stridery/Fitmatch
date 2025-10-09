package com.fitmatch.courseservice.repository;

import com.fitmatch.courseservice.entity.CoursePackagePrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
public interface CoursePackagePriceRepository extends JpaRepository<CoursePackagePrice, UUID> {
    
    /**
     * 根据课程ID查询所有包价格
     */
    List<CoursePackagePrice> findByCourseIdOrderByCreatedAtAsc(UUID courseId);
    
    /**
     * 根据课程ID列表批量查询包价格
     */
    List<CoursePackagePrice> findByCourseIdInOrderByCreatedAtAsc(List<UUID> courseIds);
    
    /**
     * 删除指定课程的所有包价格
     */
    @Modifying(clearAutomatically = true)
    @Transactional
    @Query("DELETE FROM CoursePackagePrice cpp WHERE cpp.courseId = :courseId")
    void deleteByCourseId(@Param("courseId") UUID courseId);
    
    /**
     * 批量删除指定课程的所有包价格
     */
    @Modifying(clearAutomatically = true)
    @Transactional
    @Query("DELETE FROM CoursePackagePrice cpp WHERE cpp.courseId IN :courseIds")
    void deleteByCourseIdIn(@Param("courseIds") List<UUID> courseIds);
}
