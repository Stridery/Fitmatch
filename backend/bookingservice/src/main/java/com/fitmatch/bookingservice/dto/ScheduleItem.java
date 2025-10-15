package com.fitmatch.bookingservice.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class ScheduleItem {
    
    private UUID studentId;
    private UUID coachId;
    private UUID courseId;
    private UUID userCoursePackageId;
    private UUID sessionEventId;
    private String title;
    private LocalDateTime startTs;
    private LocalDateTime endTs;
    private Integer capacity;
    private Integer bookedCount;
    private String bookingStatus;
    private LocalDateTime bookedAt;
    private LocalDateTime cancelledAt;
}
