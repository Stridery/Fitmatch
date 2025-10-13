package com.fitmatch.courseservice.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class CourseSearchRequest {
    // 基础搜索字段
    private String sport;
    private String city;
    private String coachGender;
    private BigDecimal maxPrice;
    private String excludeCoachId;  // 排除指定教练的课程（用于排除用户自己的课程）
    
    // 证书相关
    private Boolean hasCertificate;
    private List<String> certType;
    
    // 课程相关
    private List<String> lessons;
    private List<String> duration;
    private List<String> styles;
    private List<String> commStyles;
    private List<String> paceIntensities;
    private List<String> preferStudents;
    private List<String> trainingModes;
    private List<String> availableTimeSlots;
    private List<String> goals;
    private List<String> skillLevels;
    private List<String> ageGroups;
    private String preferredFrequency;
    private String skillLevel;
    private Integer minExp;
    
    // 分页和排序
    private Integer page = 0;
    private Integer size = 12;
    private String sort = "match_desc";
    
    public Integer getValidPage() {
        return page != null && page >= 0 ? page : 0;
    }
    
    public Integer getValidSize() {
        if (size == null || size < 1) {
            return 12;
        }
        return Math.min(size, 50);
    }
    
    public String getValidSort() {
        if (sort == null || sort.trim().isEmpty()) {
            return "match_desc";
        }
        return switch (sort.trim().toLowerCase()) {
            case "price_asc", "price_desc", "updated_desc" -> sort.trim().toLowerCase();
            default -> "match_desc";
        };
    }
}