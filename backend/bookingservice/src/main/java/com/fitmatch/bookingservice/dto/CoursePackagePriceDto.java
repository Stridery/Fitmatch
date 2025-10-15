package com.fitmatch.bookingservice.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class CoursePackagePriceDto {
    private UUID id;
    private UUID courseId;
    private Integer lessonsCount;
    private Integer lessonDurationMinutes;
    private BigDecimal price;
    private String trainingMode;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
