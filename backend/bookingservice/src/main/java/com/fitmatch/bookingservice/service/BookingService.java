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
            String result = bookingMapper.bookExistingSession(
                request.getEventId(),
                studentId,
                request.getUserCoursePackageId()
            );
            
            log.info("Booking function result: {}", result);
            
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
            for (ScheduleItem item : schedule) {
                log.info("Schedule item: sessionEventId={}, title={}, status={}", 
                    item.getSessionEventId(), item.getTitle(), item.getBookingStatus());
            }
            return schedule;
            
        } catch (Exception e) {
            log.error("Error getting schedule for student: {}", studentId, e);
            throw new BookingException("Failed to get schedule: " + e.getMessage(), e);
        }
    }
    
    /**
     * 获取用户waitlist记录
     */
    public List<WaitlistItem> getUserWaitlist(UUID studentId) {
        try {
            log.info("Getting waitlist for student: {}", studentId);
            
            List<WaitlistItem> waitlist = bookingMapper.getUserWaitlist(studentId);
            
            log.info("Found {} waitlist items for student: {}", waitlist.size(), studentId);
            for (WaitlistItem item : waitlist) {
                log.info("Waitlist item: sessionEventId={}, title={}, position={}", 
                    item.getSessionEventId(), item.getTitle(), item.getWaitlistPosition());
            }
            return waitlist;
            
        } catch (Exception e) {
            log.error("Error getting waitlist for student: {}", studentId, e);
            throw new BookingException("Failed to get waitlist: " + e.getMessage(), e);
        }
    }
    
    /**
     * 退出waitlist
     */
    @Transactional
    public String exitWaitlist(UUID studentId, UUID eventId) {
        try {
            log.info("Exiting waitlist for student: {}, event: {}", studentId, eventId);
            
            int deletedCount = bookingMapper.exitWaitlist(eventId, studentId);
            
            if (deletedCount > 0) {
                log.info("Successfully exited waitlist for student: {}, event: {}", studentId, eventId);
                return "EXITED";
            } else {
                log.warn("No waitlist record found for student: {}, event: {}", studentId, eventId);
                return "NOT_FOUND";
            }
            
        } catch (Exception e) {
            log.error("Error exiting waitlist for student: {}, event: {}", studentId, eventId, e);
            throw new BookingException("Failed to exit waitlist: " + e.getMessage(), e);
        }
    }
    
    /**
     * 教练取消Session（Cascade处理）
     */
    @Transactional
    public String cancelSessionByCoach(UUID coachId, UUID eventId) {
        try {
            log.info("Coach cancelling session - Coach: {}, Event: {}", coachId, eventId);
            
            String result = bookingMapper.cancelSessionByCoach(eventId, coachId);
            
            log.info("Coach session cancellation result: {}", result);
            return result;
            
        } catch (Exception e) {
            log.error("Error cancelling session by coach: {}, event: {}", coachId, eventId, e);
            throw new BookingException("Failed to cancel session: " + e.getMessage(), e);
        }
    }
    
    /**
     * 获取教练的有学生的课程（session和availability）
     * @param coachId 教练ID
     * @return 有学生的课程列表
     */
    public List<CoachBookedSessionRecord> getCoachBookedSessions(UUID coachId) {
        log.info("Getting booked sessions for coach: {}", coachId);
        
        try {
            List<CoachBookedSessionRecord> sessions = bookingMapper.getCoachBookedSessions(coachId);
            log.info("Found {} booked sessions for coach {}", sessions.size(), coachId);
            return sessions;
        } catch (Exception e) {
            log.error("Error getting coach booked sessions: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get coach booked sessions: " + e.getMessage(), e);
        }
    }
}
