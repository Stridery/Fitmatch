package com.fitmatch.bookingservice.service;

import com.fitmatch.bookingservice.dto.AvailableSlot;
import com.fitmatch.bookingservice.dto.AvailabilityBookingRequest;
import com.fitmatch.bookingservice.dto.AvailabilityBookingResponse;
import com.fitmatch.bookingservice.dto.AvailabilityBookingRecord;
import com.fitmatch.bookingservice.mapper.BookingMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Availability Booking Service
 * 处理availability预约相关的业务逻辑
 */
@Service
@Transactional
public class AvailabilityBookingService {
    
    private static final Logger log = LoggerFactory.getLogger(AvailabilityBookingService.class);
    
    @Autowired
    private BookingMapper bookingMapper;
    
    /**
     * 预约Availability时段
     * @param request 预约请求
     * @return 预约响应
     */
    public AvailabilityBookingResponse bookAvailability(AvailabilityBookingRequest request) {
        log.info("Booking availability: {}", request);
        
        try {
            String result = bookingMapper.bookAvailability(
                request.getAvailabilityId(),
                request.getStudentId(),
                request.getUserCoursePackageId(),
                request.getStartTime(),
                request.getEndTime()
            );
            
            log.info("Availability booking result: {}", result);
            
            if ("CONFIRMED".equals(result)) {
                return AvailabilityBookingResponse.builder()
                    .availabilityId(request.getAvailabilityId())
                    .studentId(request.getStudentId())
                    .userCoursePackageId(request.getUserCoursePackageId())
                    .status("CONFIRMED")
                    .startTime(request.getStartTime())
                    .endTime(request.getEndTime())
                    .bookedAt(Instant.now())
                    .message("Availability booked successfully")
                    .build();
            } else {
                return AvailabilityBookingResponse.builder()
                    .availabilityId(request.getAvailabilityId())
                    .studentId(request.getStudentId())
                    .userCoursePackageId(request.getUserCoursePackageId())
                    .status("FAILED")
                    .message("Booking failed: " + result)
                    .build();
            }
            
        } catch (Exception e) {
            log.error("Error booking availability: {}", e.getMessage(), e);
            return AvailabilityBookingResponse.builder()
                .availabilityId(request.getAvailabilityId())
                .studentId(request.getStudentId())
                .userCoursePackageId(request.getUserCoursePackageId())
                .status("ERROR")
                .message("Booking failed: " + e.getMessage())
                .build();
        }
    }
    
    /**
     * 取消Availability预约
     * @param availabilityId availability ID
     * @param studentId 学生ID
     * @return 取消结果
     */
    public AvailabilityBookingResponse cancelAvailabilityBooking(UUID availabilityId, UUID studentId) {
        log.info("Cancelling availability booking: availabilityId={}, studentId={}", availabilityId, studentId);
        
        try {
            String result = bookingMapper.cancelAvailabilityBooking(availabilityId, studentId);
            
            log.info("Availability cancellation result: {}", result);
            
            if ("CANCELLED".equals(result)) {
                return AvailabilityBookingResponse.builder()
                    .availabilityId(availabilityId)
                    .studentId(studentId)
                    .status("CANCELLED")
                    .message("Availability booking cancelled successfully")
                    .build();
            } else if ("NOOP".equals(result)) {
                return AvailabilityBookingResponse.builder()
                    .availabilityId(availabilityId)
                    .studentId(studentId)
                    .status("NOOP")
                    .message("No booking found to cancel")
                    .build();
            } else {
                return AvailabilityBookingResponse.builder()
                    .availabilityId(availabilityId)
                    .studentId(studentId)
                    .status("FAILED")
                    .message("Cancellation failed: " + result)
                    .build();
            }
            
        } catch (Exception e) {
            log.error("Error cancelling availability booking: {}", e.getMessage(), e);
            return AvailabilityBookingResponse.builder()
                .availabilityId(availabilityId)
                .studentId(studentId)
                .status("ERROR")
                .message("Cancellation failed: " + e.getMessage())
                .build();
        }
    }
    
    /**
     * 获取Availability可用时段
     * @param availabilityId availability ID
     * @return 可用时段列表
     */
    public List<AvailableSlot> getAvailableSlots(UUID availabilityId) {
        log.info("Getting available slots for availability: {}", availabilityId);
        
        try {
            List<AvailableSlot> slots = bookingMapper.getAvailabilityAvailableSlots(availabilityId);
            log.info("Found {} available slots", slots.size());
            return slots;
        } catch (Exception e) {
            log.error("Error getting available slots: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get available slots: " + e.getMessage(), e);
        }
    }
    
    /**
     * 获取用户Availability预约记录
     * @param studentId 学生ID
     * @return Availability预约记录列表
     */
    @Transactional(readOnly = true)
    public List<AvailabilityBookingRecord> getUserAvailabilityBookings(UUID studentId) {
        log.info("Getting availability bookings for student: {}", studentId);
        
        try {
            List<AvailabilityBookingRecord> bookings = bookingMapper.getUserAvailabilityBookings(studentId);
            log.info("Found {} availability bookings for student {}", bookings.size(), studentId);
            return bookings;
        } catch (Exception e) {
            log.error("Error getting user availability bookings: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get user availability bookings: " + e.getMessage(), e);
        }
    }
}
