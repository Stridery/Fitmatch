package com.fitmatch.bookingservice.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "user_course_package")
public class UserCoursePackage {
    
    @Id
    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "id")
    private UUID id;
    
    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    
    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "coach_id", nullable = false)
    private UUID coachId;
    
    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "course_id", nullable = false)
    private UUID courseId;
    
    @Column(name = "remaining_credits", nullable = false)
    private Integer remainingCredits;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PackageStatus status;
    
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
    
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
    
    public enum PackageStatus {
        ACTIVE,
        EXPIRED,
        CANCELLED
    }
}
