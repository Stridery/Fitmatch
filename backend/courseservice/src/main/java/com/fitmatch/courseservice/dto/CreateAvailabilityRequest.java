package com.fitmatch.courseservice.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

@Data
public class CreateAvailabilityRequest {
    
    @NotNull(message = "Coach ID is required")
    private UUID coachId;
    
    @NotNull(message = "Title is required")
    @NotEmpty(message = "Title cannot be empty")
    private String title;
    
    private String location;
    
    @NotNull(message = "Start time is required")
    private String startTs; // UTC时间字符串，格式：2024-01-15T18:00:00.000Z
    
    @NotNull(message = "End time is required")
    private String endTs; // UTC时间字符串，格式：2024-01-15T19:00:00.000Z
    
    // 多选课程列表
    private List<UUID> courseIds;
    
    // 验证方法
    public boolean isValidTimeRange() {
        return startTs != null && endTs != null && !startTs.isEmpty() && !endTs.isEmpty();
    }
    
    // 验证时间不重叠（需要在service层实现）
    public boolean hasValidDuration() {
        if (startTs == null || endTs == null || startTs.isEmpty() || endTs.isEmpty()) return false;
        try {
            java.time.Instant start = java.time.Instant.parse(startTs);
            java.time.Instant end = java.time.Instant.parse(endTs);
            return java.time.Duration.between(start, end).toMinutes() >= 30; // 至少30分钟
        } catch (Exception e) {
            return false;
        }
    }
    
    // 直接返回字符串，不做时区转换
    public String getStartTs() {
        return startTs;
    }
    
    public String getEndTs() {
        return endTs;
    }
}
