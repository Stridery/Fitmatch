package com.fitmatch.courseservice.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class CourseCardDto {
    private String courseId;
    private String courseTitle;
    private String sportName;
    private String coachName;
    private String coachNickname;  // 等同 coachName，来自 nickname
    private String city;
    private List<String> certificates;
    private BigDecimal pricePerSession;  // 映射 price_per_lesson_min
    private BigDecimal pricePerHour;     // 映射 price_per_hour_min
    private List<String> styles;
    private List<String> commStyles;
    private List<String> paceIntensities;
    private List<String> preferStudents;
    private Double matchScore;
}


