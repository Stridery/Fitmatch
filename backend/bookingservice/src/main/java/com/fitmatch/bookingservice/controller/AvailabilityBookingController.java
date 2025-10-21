package com.fitmatch.bookingservice.controller;

import com.fitmatch.bookingservice.dto.AvailableSlot;
import com.fitmatch.bookingservice.dto.AvailabilityBookingRequest;
import com.fitmatch.bookingservice.dto.AvailabilityBookingResponse;
import com.fitmatch.bookingservice.dto.AvailabilityBookingRecord;
import com.fitmatch.bookingservice.dto.ErrorResponse;
import com.fitmatch.bookingservice.service.AvailabilityBookingService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Availability Booking Controller
 * 处理availability预约相关的REST API
 */
@RestController
@RequestMapping("/bookings/availability")
@CrossOrigin(origins = "*")
public class AvailabilityBookingController {
    
    private static final Logger log = LoggerFactory.getLogger(AvailabilityBookingController.class);
    
    @Autowired
    private AvailabilityBookingService availabilityBookingService;
    
    /**
     * 预约Availability时段
     * POST /booking/availability/book
     */
    @PostMapping("/book")
    public ResponseEntity<?> bookAvailability(@Valid @RequestBody AvailabilityBookingRequest request) {
        log.info("Received availability booking request: {}", request);
        
        try {
            AvailabilityBookingResponse response = availabilityBookingService.bookAvailability(request);
            
            if ("CONFIRMED".equals(response.getStatus())) {
                return ResponseEntity.ok(response);
            } else if ("ERROR".equals(response.getStatus())) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(response.getMessage()));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(response.getMessage()));
            }
            
        } catch (Exception e) {
            log.error("Error processing availability booking request: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to book availability: " + e.getMessage()));
        }
    }
    
    /**
     * 取消Availability预约
     * DELETE /booking/availability/{availabilityId}/cancel/{studentId}
     */
    @DeleteMapping("/{availabilityId}/cancel/{studentId}")
    public ResponseEntity<?> cancelAvailabilityBooking(
            @PathVariable UUID availabilityId,
            @PathVariable UUID studentId) {
        log.info("Received availability cancellation request: availabilityId={}, studentId={}", 
                availabilityId, studentId);
        
        try {
            AvailabilityBookingResponse response = availabilityBookingService.cancelAvailabilityBooking(
                availabilityId, studentId);
            
            if ("CANCELLED".equals(response.getStatus())) {
                return ResponseEntity.ok(response);
            } else if ("NOOP".equals(response.getStatus())) {
                return ResponseEntity.ok(response);
            } else if ("ERROR".equals(response.getStatus())) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(response.getMessage()));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(response.getMessage()));
            }
            
        } catch (Exception e) {
            log.error("Error processing availability cancellation request: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to cancel availability booking: " + e.getMessage()));
        }
    }
    
    /**
     * 获取Availability可用时段
     * GET /booking/availability/{availabilityId}/available-slots
     */
    @GetMapping("/{availabilityId}/available-slots")
    public ResponseEntity<?> getAvailableSlots(@PathVariable UUID availabilityId) {
        log.info("Getting available slots for availability: {}", availabilityId);
        
        try {
            List<AvailableSlot> slots = availabilityBookingService.getAvailableSlots(availabilityId);
            return ResponseEntity.ok(slots);
            
        } catch (Exception e) {
            log.error("Error getting available slots: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to get available slots: " + e.getMessage()));
        }
    }
    
    /**
     * 获取用户Availability预约记录
     * GET /booking/availability/user/{studentId}
     */
    @GetMapping("/user/{studentId}")
    public ResponseEntity<?> getUserAvailabilityBookings(@PathVariable UUID studentId) {
        log.info("Getting availability bookings for student: {}", studentId);
        
        try {
            List<AvailabilityBookingRecord> bookings = availabilityBookingService.getUserAvailabilityBookings(studentId);
            return ResponseEntity.ok(bookings);
            
        } catch (Exception e) {
            log.error("Error getting user availability bookings: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to get user availability bookings: " + e.getMessage()));
        }
    }
    
    /**
     * 获取当前用户Availability预约记录
     * GET /booking/availability/user/me
     */
    @GetMapping("/user/me")
    public ResponseEntity<?> getCurrentUserAvailabilityBookings(
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader) {
        log.info("Getting availability bookings for current user");
        
        try {
            // 从请求头获取用户ID，如果没有则使用默认值（开发阶段）
            UUID currentUserId = userIdHeader != null ? UUID.fromString(userIdHeader) : UUID.fromString("3047992c-2d2e-4171-9bde-a6e05357d3f7");
            List<AvailabilityBookingRecord> bookings = availabilityBookingService.getUserAvailabilityBookings(currentUserId);
            return ResponseEntity.ok(bookings);
            
        } catch (Exception e) {
            log.error("Error getting current user availability bookings: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to get current user availability bookings: " + e.getMessage()));
        }
    }
}
