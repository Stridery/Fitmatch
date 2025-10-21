package com.fitmatch.courseservice.repository;

import com.fitmatch.courseservice.entity.CoachCalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface CoachCalendarEventRepository extends JpaRepository<CoachCalendarEvent, UUID> {
    
    /**
     * 根据教练ID查找所有事件
     */
    List<CoachCalendarEvent> findByCoachIdOrderByStartTsAsc(UUID coachId);
    
    /**
     * 根据教练ID和时间范围查找事件
     */
    @Query("SELECT cce FROM CoachCalendarEvent cce WHERE cce.coachId = :coachId " +
           "AND cce.startTs >= :startTime AND cce.endTs <= :endTime " +
           "ORDER BY cce.startTs ASC")
    List<CoachCalendarEvent> findByCoachIdAndTimeRange(
        @Param("coachId") UUID coachId,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime
    );
    
    /**
     * 根据课程ID查找session事件
     */
    List<CoachCalendarEvent> findByCourseIdAndKindOrderByStartTsAsc(UUID courseId, String kind);
    
    /**
     * 检查时间冲突（排除指定事件ID）
     */
    @Query("SELECT COUNT(cce) > 0 FROM CoachCalendarEvent cce WHERE cce.coachId = :coachId " +
           "AND cce.id != :excludeId " +
           "AND ((cce.startTs < :endTime AND cce.endTs > :startTime))")
    boolean hasTimeConflict(
        @Param("coachId") UUID coachId,
        @Param("excludeId") UUID excludeId,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime
    );
    
    /**
     * 检查时间冲突（新建事件）
     */
    @Query("SELECT COUNT(cce) > 0 FROM CoachCalendarEvent cce WHERE cce.coachId = :coachId " +
           "AND ((cce.startTs < :endTime AND cce.endTs > :startTime))")
    boolean hasTimeConflict(
        @Param("coachId") UUID coachId,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime
    );
    
    /**
     * 根据事件类型查找事件
     */
    List<CoachCalendarEvent> findByKindOrderByStartTsAsc(String kind);
    
    /**
     * 查找未来的事件
     */
    @Query("SELECT cce FROM CoachCalendarEvent cce WHERE cce.coachId = :coachId " +
           "AND cce.startTs > :now ORDER BY cce.startTs ASC")
    List<CoachCalendarEvent> findFutureEventsByCoachId(
        @Param("coachId") UUID coachId,
        @Param("now") LocalDateTime now
    );
}
