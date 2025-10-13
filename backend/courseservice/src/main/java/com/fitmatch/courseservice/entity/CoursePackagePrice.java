package com.fitmatch.courseservice.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "course_package_prices")
public class CoursePackagePrice {
    
    @Id
    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "id")
    private UUID id;
    
    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "course_id", nullable = false)
    private UUID courseId;
    
    @Column(name = "lessons_count", nullable = false)
    private Integer lessonsCount;
    
    @Column(name = "lesson_duration_minutes", nullable = false)
    private Integer lessonDurationMinutes;
    
    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
    
    @Column(name = "training_mode", nullable = false)
    private String trainingMode;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
    }
}
