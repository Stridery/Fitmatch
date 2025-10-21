package com.fitmatch.courseservice.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotEmpty;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
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
    private Instant startTs; // 使用Instant处理UTC时间
    
    @NotNull(message = "End time is required")
    private Instant endTs; // 使用Instant处理UTC时间
    
    // 多选课程列表
    private List<UUID> courseIds;
    
    // 验证方法
    public boolean isValidTimeRange() {
        return startTs != null && endTs != null && startTs.isBefore(endTs);
    }
    
    // 验证时间不重叠（需要在service层实现）
    public boolean hasValidDuration() {
        if (startTs == null || endTs == null) return false;
        return java.time.Duration.between(startTs, endTs).toMinutes() >= 30; // 至少30分钟
    }
    
    // 转换为LocalDateTime（UTC）
    public LocalDateTime getStartTsAsLocalDateTime() {
        return startTs != null ? LocalDateTime.ofInstant(startTs, ZoneOffset.UTC) : null;
    }
    
    public LocalDateTime getEndTsAsLocalDateTime() {
        return endTs != null ? LocalDateTime.ofInstant(endTs, ZoneOffset.UTC) : null;
    }
}
