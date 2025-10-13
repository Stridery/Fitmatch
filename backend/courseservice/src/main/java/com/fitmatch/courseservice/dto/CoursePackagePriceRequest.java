package com.fitmatch.courseservice.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CoursePackagePriceRequest {
    private String courseId;
    private List<PackageItem> packages;
    
    @Data
    public static class PackageItem {
        private Integer lessons_count;
        private Integer lesson_duration_minutes;
        private BigDecimal price;
        private String training_mode;
    }
}
