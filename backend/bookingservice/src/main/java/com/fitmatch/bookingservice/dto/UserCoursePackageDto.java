package com.fitmatch.bookingservice.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class UserCoursePackageDto {
    private UUID id;
    private UUID userId;
    private UUID coachId;
    private UUID courseId;
    private UUID packagePriceId;
    private Integer totalCredits;
    private Integer remainingCredits;
    private String status;
    private LocalDateTime expiresAt;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
