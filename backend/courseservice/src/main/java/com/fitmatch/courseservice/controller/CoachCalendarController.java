package com.fitmatch.courseservice.controller;

import com.fitmatch.courseservice.dto.CreateAvailabilityRequest;
import com.fitmatch.courseservice.dto.UpdateAvailabilityRequest;
import com.fitmatch.courseservice.entity.AvailabilityCourse;
import com.fitmatch.courseservice.entity.CoachCalendarEvent;
import com.fitmatch.courseservice.service.CoachCalendarService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/courses/coach/calendar")
@RequiredArgsConstructor
public class CoachCalendarController {
    
    private final CoachCalendarService calendarService;
    
    /**
     * 创建availability事件
     */
    @PostMapping("/availability")
    public ResponseEntity<?> createAvailability(@Valid @RequestBody CreateAvailabilityRequest request) {
        try {
            log.info("Creating availability for coach: {}", request.getCoachId());
            
            CoachCalendarEvent event = calendarService.createAvailability(request);
            
            // 转换为前端期望的格式
            Map<String, Object> response = new HashMap<>();
            response.put("id", event.getId());
            response.put("coach_id", event.getCoachId());
            response.put("kind", event.getKind());
            response.put("course_id", event.getCourseId());
            response.put("title", event.getTitle());
            response.put("location", event.getLocation());
            response.put("start_ts", event.getStartTs().toString()); // Instant直接toString为ISO 8601格式
            response.put("end_ts", event.getEndTs().toString()); // Instant直接toString为ISO 8601格式
            response.put("capacity", event.getCapacity());
            response.put("booked_count", event.getBookedCount());
            response.put("created_at", event.getCreatedAt().toString());
            response.put("updated_at", event.getUpdatedAt().toString());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request for creating availability: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating availability", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to create availability: " + e.getMessage()));
        }
    }
    
    /**
     * 更新availability事件
     */
    @PutMapping("/availability")
    public ResponseEntity<?> updateAvailability(@Valid @RequestBody UpdateAvailabilityRequest request) {
        try {
            log.info("Updating availability: {}", request.getAvailabilityId());
            
            CoachCalendarEvent event = calendarService.updateAvailability(request);
            
            // 转换为前端期望的格式
            Map<String, Object> response = new HashMap<>();
            response.put("id", event.getId());
            response.put("coach_id", event.getCoachId());
            response.put("kind", event.getKind());
            response.put("course_id", event.getCourseId());
            response.put("title", event.getTitle());
            response.put("location", event.getLocation());
            response.put("start_ts", event.getStartTs().toString()); // Instant直接toString为ISO 8601格式
            response.put("end_ts", event.getEndTs().toString()); // Instant直接toString为ISO 8601格式
            response.put("capacity", event.getCapacity());
            response.put("booked_count", event.getBookedCount());
            response.put("created_at", event.getCreatedAt().toString());
            response.put("updated_at", event.getUpdatedAt().toString());
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request for updating availability: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating availability", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to update availability: " + e.getMessage()));
        }
    }
    
    /**
     * 删除availability事件
     */
    @DeleteMapping("/availability/{availabilityId}")
    public ResponseEntity<?> deleteAvailability(
            @PathVariable UUID availabilityId,
            @RequestParam UUID coachId) {
        try {
            log.info("Deleting availability: {} for coach: {}", availabilityId, coachId);
            
            calendarService.deleteAvailability(availabilityId, coachId);
            
            return ResponseEntity.ok().body(new SuccessResponse("Availability deleted successfully"));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request for deleting availability: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error deleting availability", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to delete availability: " + e.getMessage()));
        }
    }
    
    /**
     * 获取教练的availability列表
     */
    @GetMapping("/availability/coach/{coachId}")
    public ResponseEntity<?> getCoachAvailabilities(
            @PathVariable UUID coachId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        try {
            log.info("Getting availabilities for coach: {}, startDate: {}, endDate: {}", coachId, startDate, endDate);
            
            List<CoachCalendarEvent> availabilities;
            
            if (startDate != null && endDate != null) {
                // 按时间范围过滤，直接解析UTC时间字符串
                java.time.Instant startTime = java.time.Instant.parse(startDate);
                java.time.Instant endTime = java.time.Instant.parse(endDate);
                availabilities = calendarService.getCoachAvailabilities(coachId, startTime, endTime);
            } else {
                // 获取所有availability
                availabilities = calendarService.getCoachAvailabilities(coachId);
            }
            
            // 转换为前端期望的格式
            List<Map<String, Object>> response = availabilities.stream()
                .map(event -> {
                    Map<String, Object> eventMap = new HashMap<>();
                    eventMap.put("id", event.getId());
                    eventMap.put("coach_id", event.getCoachId());
                    eventMap.put("kind", event.getKind());
                    eventMap.put("course_id", event.getCourseId());
                    eventMap.put("title", event.getTitle());
                    eventMap.put("location", event.getLocation());
                    eventMap.put("start_ts", event.getStartTs().toString()); // Instant直接toString为ISO 8601格式
                    eventMap.put("end_ts", event.getEndTs().toString()); // Instant直接toString为ISO 8601格式
                    eventMap.put("capacity", event.getCapacity());
                    eventMap.put("booked_count", event.getBookedCount());
                    eventMap.put("created_at", event.getCreatedAt().toString());
                    eventMap.put("updated_at", event.getUpdatedAt().toString());
                    return eventMap;
                })
                .toList();
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting coach availabilities", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to get availabilities: " + e.getMessage()));
        }
    }
    
    /**
     * 获取availability的关联课程
     */
    @GetMapping("/availability/{availabilityId}/courses")
    public ResponseEntity<?> getAvailabilityCourses(@PathVariable UUID availabilityId) {
        try {
            log.info("Getting courses for availability: {}", availabilityId);
            
            List<AvailabilityCourse> courses = calendarService.getAvailabilityCourses(availabilityId);
            
            return ResponseEntity.ok(courses);
        } catch (Exception e) {
            log.error("Error getting availability courses", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to get availability courses: " + e.getMessage()));
        }
    }
    
    
    /**
     * 错误响应类
     */
    public static class ErrorResponse {
        private String message;
        
        public ErrorResponse(String message) {
            this.message = message;
        }
        
        public String getMessage() {
            return message;
        }
        
        public void setMessage(String message) {
            this.message = message;
        }
    }
    
    /**
     * 成功响应类
     */
    public static class SuccessResponse {
        private String message;
        
        public SuccessResponse(String message) {
            this.message = message;
        }
        
        public String getMessage() {
            return message;
        }
        
        public void setMessage(String message) {
            this.message = message;
        }
    }
}
