package com.fitmatch.bookingservice.controller;

import com.fitmatch.bookingservice.dto.*;
import com.fitmatch.bookingservice.mapper.BookingMapper;
import com.fitmatch.bookingservice.service.BookingService;
import com.fitmatch.bookingservice.service.UserCoursePackageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final UserCoursePackageService userCoursePackageService;
    private final BookingMapper bookingMapper;
    
    /**
     * 预约Session
     */
    @PostMapping("/session")
    public ResponseEntity<BookingResponse> bookSession(
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @Valid @RequestBody BookingRequest request) {
        
        // 从请求头获取用户ID，如果没有则使用默认值（开发阶段）
        UUID studentId = userIdHeader != null ? UUID.fromString(userIdHeader) : UUID.randomUUID();
        
        log.info("Booking session request - Student: {}, Event: {}, Package: {}", 
            studentId, request.getEventId(), request.getUserCoursePackageId());
        
        BookingResponse response = bookingService.bookSession(studentId, request);
        return ResponseEntity.ok(response);
    }
    
    /**
     * 取消预约
     */
    @PostMapping("/cancel")
    public ResponseEntity<CancelBookingResponse> cancelBooking(
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @Valid @RequestBody CancelBookingRequest request) {
        
        // 从请求头获取用户ID，如果没有则使用默认值（开发阶段）
        UUID studentId = userIdHeader != null ? UUID.fromString(userIdHeader) : UUID.randomUUID();
        
        log.info("Cancel booking request from user: {}", studentId);
        CancelBookingResponse response = bookingService.cancelBooking(studentId, request);
        return ResponseEntity.ok(response);
    }
    
    /**
     * 手动补位等候队列队首
     */
    @PostMapping("/promote/{eventId}")
    public ResponseEntity<String> promoteWaitlistHead(@PathVariable UUID eventId) {
        log.info("Promote waitlist head request for event: {}", eventId);
        String result = bookingService.promoteWaitlistHead(eventId);
        return ResponseEntity.ok(result);
    }
    
    /**
     * 获取学生个人日程
     */
    @GetMapping("/schedule")
    public ResponseEntity<List<ScheduleItem>> getStudentSchedule(
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestParam(value = "from", required = false) String fromDate,
            @RequestParam(value = "to", required = false) String toDate) {
        
        // 从请求头获取用户ID，如果没有则使用默认值（开发阶段）
        UUID studentId = userIdHeader != null ? UUID.fromString(userIdHeader) : UUID.randomUUID();
        
        log.info("Get schedule request from user: {}", studentId);
        List<ScheduleItem> schedule = bookingService.getStudentSchedule(studentId, fromDate, toDate);
        return ResponseEntity.ok(schedule);
    }
    
    /**
     * 获取用户waitlist记录
     */
    @GetMapping("/waitlist")
    public ResponseEntity<List<WaitlistItem>> getUserWaitlist(
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader) {
        
        // 从请求头获取用户ID，如果没有则使用默认值（开发阶段）
        UUID studentId = userIdHeader != null ? UUID.fromString(userIdHeader) : UUID.randomUUID();
        
        log.info("Get waitlist request from user: {}", studentId);
        List<WaitlistItem> waitlist = bookingService.getUserWaitlist(studentId);
        return ResponseEntity.ok(waitlist);
    }
    
    /**
     * 退出waitlist
     */
    @PostMapping("/waitlist/exit")
    public ResponseEntity<String> exitWaitlist(
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @Valid @RequestBody ExitWaitlistRequest request) {
        
        // 从请求头获取用户ID，如果没有则使用默认值（开发阶段）
        UUID studentId = userIdHeader != null ? UUID.fromString(userIdHeader) : UUID.randomUUID();
        
        log.info("Exit waitlist request from user: {}, event: {}", studentId, request.getEventId());
        String result = bookingService.exitWaitlist(studentId, request.getEventId());
        return ResponseEntity.ok(result);
    }
    
    /**
     * 教练取消Session（Cascade处理）
     */
    @PostMapping("/coach/cancel-session")
    public ResponseEntity<String> cancelSessionByCoach(
            @RequestHeader(value = "X-User-Id", required = false) String coachIdHeader,
            @Valid @RequestBody CancelSessionByCoachRequest request) {
        
        // 从请求头获取教练ID，如果没有则使用默认值（开发阶段）
        UUID coachId = coachIdHeader != null ? UUID.fromString(coachIdHeader) : UUID.randomUUID();
        
        log.info("Coach cancel session request - Coach: {}, Event: {}", coachId, request.getEventId());
        String result = bookingService.cancelSessionByCoach(coachId, request.getEventId());
        return ResponseEntity.ok(result);
    }

    // ==================== 用户课包管理API ====================
    
    /**
     * 获取用户的课包列表
     */
    @GetMapping("/user-packages")
    public ResponseEntity<List<UserCoursePackageDto>> getUserPackages(
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestParam(required = false) UUID courseId) {
        
        // 从请求头获取用户ID，如果没有则使用默认值（开发阶段）
        UUID userId = userIdHeader != null ? UUID.fromString(userIdHeader) : UUID.randomUUID();
        
        log.info("Getting user packages for user: {}, course: {}", userId, courseId);
        
        List<UserCoursePackageDto> packages;
        if (courseId != null) {
            packages = userCoursePackageService.getUserPackagesByCourse(userId, courseId);
        } else {
            packages = userCoursePackageService.getUserPackages(userId);
        }
        
        return ResponseEntity.ok(packages);
    }
    
    @GetMapping("/debug-bookings")
    public ResponseEntity<Map<String, Object>> debugBookings(
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader) {
        
        UUID userId = userIdHeader != null ? UUID.fromString(userIdHeader) : UUID.randomUUID();
        
        Map<String, Object> response = new HashMap<>();
        try {
            // 先检查原始SQL查询
            String rawQuery = """
                SELECT 
                    sb.student_id as "studentId",
                    cce.coach_id as "coachId",
                    cce.course_id as "courseId",
                    sb.user_course_package_id as "userCoursePackageId",
                    cce.id as "sessionEventId",
                    cce.title as "title",
                    cce.start_ts::timestamp as "startTs",
                    cce.end_ts::timestamp as "endTs",
                    cce.capacity as "capacity",
                    cce.booked_count as "bookedCount",
                    sb.status as "bookingStatus",
                    sb.booked_at::timestamp as "bookedAt",
                    sb.cancelled_at::timestamp as "cancelledAt"
                FROM public.session_booking sb
                JOIN public.coach_calendar_event cce ON cce.id = sb.event_id
                WHERE cce.kind = 'session'
                AND sb.student_id = ?
                """;
            
            log.info("Raw SQL query: {}", rawQuery);
            log.info("Query parameters: studentId={}", userId);
            
            List<ScheduleItem> schedule = bookingService.getStudentSchedule(userId, null, null);
            response.put("status", "success");
            response.put("bookings", schedule);
            response.put("count", schedule.size());
            response.put("rawQuery", rawQuery);
            response.put("studentId", userId.toString());
        } catch (Exception e) {
            response.put("status", "error");
            response.put("error", e.getMessage());
        }
        return ResponseEntity.ok(response);
    }
    
    /**
     * 购买课包
     */
    @PostMapping("/user-packages/purchase")
    public ResponseEntity<PurchasePackageResponse> purchasePackage(
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @Valid @RequestBody PurchasePackageRequest request) {
        
        // 从请求头获取用户ID，如果没有则使用默认值（开发阶段）
        UUID userId = userIdHeader != null ? UUID.fromString(userIdHeader) : UUID.randomUUID();
        
        log.info("Purchase package request - User: {}, Package: {}, Course: {}", 
            userId, request.getPackagePriceId(), request.getCourseId());
        
        PurchasePackageResponse response = userCoursePackageService.purchasePackage(userId, request);
        
        if (response.isSuccess()) {
            log.info("Package purchased successfully - User Package ID: {}", response.getUserPackageId());
        } else {
            log.warn("Package purchase failed: {}", response.getMessage());
        }
        
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 使用课包次数
     */
    @PostMapping("/user-packages/{packageId}/use-credits")
    public ResponseEntity<String> usePackageCredits(
            @PathVariable UUID packageId,
            @RequestBody UseCreditsRequest request) {
        
        log.info("Using {} credits from package: {}", request.getCredits(), packageId);
        
        boolean success = userCoursePackageService.usePackageCredits(packageId, request.getCredits());
        
        if (success) {
            return ResponseEntity.ok("Credits used successfully");
        } else {
            return ResponseEntity.badRequest().body("Failed to use credits");
        }
    }
    
    
    @lombok.Data
    public static class UseCreditsRequest {
        private int credits = 1;
    }
}
