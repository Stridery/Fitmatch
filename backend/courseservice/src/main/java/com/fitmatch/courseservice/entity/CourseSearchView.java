package com.fitmatch.courseservice.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "v_course_search")
public class CourseSearchView {
    @Id
    private String courseId;  // Changed from Long to String to keep UUID format
    private String courseTitle;
    private String courseDesc;
    
    // 运动相关
    private String sportId;  // Changed from Long to String to keep UUID format
    private String sportName;
    
    // 教练相关
    private String coachId;  // Changed from Long to String to keep UUID format
    private String coachName;
    private String coachGender;
    private String city;
    private String country;
    private Integer coachAge;
    
    // 教练资质
    private Boolean hasCertificate;
    private String certificateType;
    private String coachExperienceText;
    private Integer experienceYearsInt;
    
    // 课程结构化信息
    private List<String> trainingModes;
    private List<String> availableTimeSlots;
    private String preferredFrequency;
    private List<String> trainingGoals;
    private List<String> skillLevels;
    private List<String> ageGroups;
    private String skillLevel;
    private String courseExperienceBucket;  // lt1|1_2|3_4|5_plus
    
    // 价格信息
    private BigDecimal pricePerLessonMin;
    private List<Integer> lessonOptions;
    private List<Integer> durationOptions;
    private Integer packageCount;
    
    // 课程属性
    private List<String> styles;
    private List<String> commStyles;
    private List<String> paceIntensities;
    private List<String> preferStudents;
    
    // 时间戳
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 匹配分数 - 这个字段不在数据库中，是查询时计算的
    @Transient  // 告诉 JPA 这个字段不是数据库列
    private Double matchScore;
}