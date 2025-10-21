package com.fitmatch.courseservice.repository;

import com.fitmatch.courseservice.entity.AvailabilityCourse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
public interface AvailabilityCourseRepository extends JpaRepository<AvailabilityCourse, UUID> {
    
    /**
     * 根据availability_id查找所有关联的课程
     */
    List<AvailabilityCourse> findByAvailabilityId(UUID availabilityId);
    
    /**
     * 根据course_id查找所有关联的availability
     */
    List<AvailabilityCourse> findByCourseId(UUID courseId);
    
    /**
     * 删除指定availability的所有课程关联
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM AvailabilityCourse ac WHERE ac.availabilityId = :availabilityId")
    void deleteByAvailabilityId(@Param("availabilityId") UUID availabilityId);
    
    /**
     * 删除指定course的所有availability关联
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM AvailabilityCourse ac WHERE ac.courseId = :courseId")
    void deleteByCourseId(@Param("courseId") UUID courseId);
    
    /**
     * 检查availability和course的关联是否存在
     */
    boolean existsByAvailabilityIdAndCourseId(UUID availabilityId, UUID courseId);
    
    /**
     * 批量插入availability-course关联
     */
    @Modifying
    @Transactional
    @Query(value = "INSERT INTO availability_courses (id, availability_id, course_id, created_at) VALUES " +
            "(gen_random_uuid(), :availabilityId, :courseId, now())", nativeQuery = true)
    void insertAvailabilityCourse(@Param("availabilityId") UUID availabilityId, @Param("courseId") UUID courseId);
}
