package com.fitmatch.bookingservice.repository;

import com.fitmatch.bookingservice.entity.SessionBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionBookingRepository extends JpaRepository<SessionBooking, UUID> {
    
    /**
     * 根据事件ID和学生ID查找预约记录
     */
    Optional<SessionBooking> findByEventIdAndStudentId(UUID eventId, UUID studentId);
    
    /**
     * 根据事件ID查找所有预约记录
     */
    List<SessionBooking> findByEventId(UUID eventId);
    
    /**
     * 根据学生ID查找所有预约记录
     */
    List<SessionBooking> findByStudentId(UUID studentId);
    
    /**
     * 根据学生ID和状态查找预约记录
     */
    List<SessionBooking> findByStudentIdAndStatus(UUID studentId, SessionBooking.BookingStatus status);
    
    /**
     * 根据事件ID和状态查找预约记录
     */
    List<SessionBooking> findByEventIdAndStatus(UUID eventId, SessionBooking.BookingStatus status);
    
    /**
     * 统计事件ID的确认预约数量
     */
    @Query("SELECT COUNT(sb) FROM SessionBooking sb WHERE sb.eventId = :eventId AND sb.status = 'CONFIRMED'")
    long countConfirmedBookingsByEventId(@Param("eventId") UUID eventId);
}
