package com.fitmatch.bookingservice.service;

import com.fitmatch.bookingservice.dto.*;
import com.fitmatch.bookingservice.exception.BookingException;
import com.fitmatch.bookingservice.mapper.BookingMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {
    
    private final BookingMapper bookingMapper;
    
    /**
     * 预约Session
     */
    @Transactional
    public BookingResponse bookSession(UUID studentId, BookingRequest request) {
        try {
            log.info("Booking session for student: {}, event: {}, package: {}", 
                studentId, request.getEventId(), request.getUserCoursePackageId());
            
            String result = bookingMapper.bookExistingSession(
                request.getEventId(),
                studentId,
                request.getUserCoursePackageId()
            );
            
            if ("CONFIRMED".equals(result)) {
                log.info("Booking confirmed for student: {}, event: {}", studentId, request.getEventId());
                return BookingResponse.confirmed(UUID.randomUUID().toString());
            } else if ("WAITLISTED".equals(result)) {
                log.info("Student: {} added to waitlist for event: {}", studentId, request.getEventId());
                return BookingResponse.waitlisted();
            } else {
                throw new BookingException("Unexpected booking result: " + result);
            }
            
        } catch (Exception e) {
            log.error("Error booking session for student: {}, event: {}", studentId, request.getEventId(), e);
            throw new BookingException("Failed to book session: " + e.getMessage(), e);
        }
    }
    
    /**
     * 取消预约
     */
    @Transactional
    public CancelBookingResponse cancelBooking(UUID studentId, CancelBookingRequest request) {
        try {
            log.info("Cancelling booking for student: {}, event: {}", studentId, request.getEventId());
            
            String result = bookingMapper.cancelSessionBooking(
                request.getEventId(),
                studentId
            );
            
            if (result.startsWith("PROMOTED:")) {
                String promotedStudentId = result.substring("PROMOTED:".length());
                log.info("Booking cancelled and student: {} promoted from waitlist for event: {}", 
                    promotedStudentId, request.getEventId());
                return CancelBookingResponse.promoted(promotedStudentId);
            } else if ("CANCELLED".equals(result)) {
                log.info("Booking cancelled for student: {}, event: {}", studentId, request.getEventId());
                return CancelBookingResponse.cancelled();
            } else if ("NOOP".equals(result)) {
                log.info("No confirmed booking found to cancel for student: {}, event: {}", 
                    studentId, request.getEventId());
                return CancelBookingResponse.noop();
            } else {
                throw new BookingException("Unexpected cancel result: " + result);
            }
            
        } catch (Exception e) {
            log.error("Error cancelling booking for student: {}, event: {}", studentId, request.getEventId(), e);
            throw new BookingException("Failed to cancel booking: " + e.getMessage(), e);
        }
    }
    
    /**
     * 手动补位等候队列队首
     */
    @Transactional
    public String promoteWaitlistHead(UUID eventId) {
        try {
            log.info("Promoting waitlist head for event: {}", eventId);
            
            String result = bookingMapper.promoteWaitlistHead(eventId);
            
            if (result.startsWith("PROMOTED:")) {
                String promotedStudentId = result.substring("PROMOTED:".length());
                log.info("Student: {} promoted from waitlist for event: {}", promotedStudentId, eventId);
            } else if ("EMPTY".equals(result)) {
                log.info("Waitlist is empty for event: {}", eventId);
            }
            
            return result;
            
        } catch (Exception e) {
            log.error("Error promoting waitlist head for event: {}", eventId, e);
            throw new BookingException("Failed to promote waitlist head: " + e.getMessage(), e);
        }
    }
    
    /**
     * 获取学生个人日程
     */
    public List<ScheduleItem> getStudentSchedule(UUID studentId, String fromDate, String toDate) {
        try {
            log.info("Getting schedule for student: {}, from: {}, to: {}", studentId, fromDate, toDate);
            
            List<ScheduleItem> schedule = bookingMapper.getStudentPersonalSchedule(
                studentId, fromDate, toDate
            );
            
            log.info("Found {} schedule items for student: {}", schedule.size(), studentId);
            return schedule;
            
        } catch (Exception e) {
            log.error("Error getting schedule for student: {}", studentId, e);
            throw new BookingException("Failed to get schedule: " + e.getMessage(), e);
        }
    }
}
