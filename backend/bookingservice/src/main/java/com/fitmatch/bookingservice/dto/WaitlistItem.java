package com.fitmatch.bookingservice.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class WaitlistItem {
    
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
    private Integer waitlistPosition;
    private LocalDateTime waitlistCreatedAt;
}
