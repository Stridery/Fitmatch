package com.fitmatch.bookingservice.controller;

import com.fitmatch.bookingservice.dto.*;
import com.fitmatch.bookingservice.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    
    /**
     * 预约Session
     */
    @PostMapping("/session")
    public ResponseEntity<BookingResponse> bookSession(
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @Valid @RequestBody BookingRequest request) {
        
        // 从请求头获取用户ID，如果没有则使用默认值（开发阶段）
        UUID studentId = userIdHeader != null ? UUID.fromString(userIdHeader) : UUID.randomUUID();
        
        log.info("Booking session request from user: {}", studentId);
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
}
