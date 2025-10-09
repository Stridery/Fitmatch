package com.fitmatch.courseservice.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CoursePackagePriceDto {
    private String id;
    private String courseId;
    private Integer lessonsCount;
    private Integer lessonDurationMinutes;
    private BigDecimal price;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

