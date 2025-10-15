package com.fitmatch.bookingservice.repository;

import com.fitmatch.bookingservice.entity.SessionWaitlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionWaitlistRepository extends JpaRepository<SessionWaitlist, UUID> {
    
    /**
     * 根据事件ID和学生ID查找等候记录
     */
    Optional<SessionWaitlist> findByEventIdAndStudentId(UUID eventId, UUID studentId);
    
    /**
     * 根据事件ID查找所有等候记录，按位置排序
     */
    List<SessionWaitlist> findByEventIdOrderByPositionAsc(UUID eventId);
    
    /**
     * 根据学生ID查找所有等候记录
     */
    List<SessionWaitlist> findByStudentId(UUID studentId);
    
    /**
     * 查找事件ID的队首等候记录
     */
    @Query("SELECT sw FROM SessionWaitlist sw WHERE sw.eventId = :eventId ORDER BY sw.position ASC LIMIT 1")
    Optional<SessionWaitlist> findFirstByEventIdOrderByPositionAsc(@Param("eventId") UUID eventId);
    
    /**
     * 统计事件ID的等候数量
     */
    @Query("SELECT COUNT(sw) FROM SessionWaitlist sw WHERE sw.eventId = :eventId")
    long countByEventId(@Param("eventId") UUID eventId);
    
    /**
     * 获取事件ID的最大位置
     */
    @Query("SELECT COALESCE(MAX(sw.position), 0) FROM SessionWaitlist sw WHERE sw.eventId = :eventId")
    Integer findMaxPositionByEventId(@Param("eventId") UUID eventId);
}
