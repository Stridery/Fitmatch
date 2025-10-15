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
@Table(name = "session_waitlist")
public class SessionWaitlist {
    
    @Id
    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "id")
    private UUID id;
    
    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "event_id", nullable = false)
    private UUID eventId;
    
    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "student_id", nullable = false)
    private UUID studentId;
    
    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "user_course_package_id", nullable = false)
    private UUID userCoursePackageId;
    
    @Column(name = "position", nullable = false)
    private Integer position;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
    }
}
