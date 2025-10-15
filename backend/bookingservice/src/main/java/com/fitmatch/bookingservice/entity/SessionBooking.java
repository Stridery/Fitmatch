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
@Table(name = "session_booking")
public class SessionBooking {
    
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
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private BookingStatus status;
    
    @Column(name = "booked_at")
    private LocalDateTime bookedAt;
    
    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;
    
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
    
    public enum BookingStatus {
        CONFIRMED,
        CANCELLED,
        NO_SHOW
    }
}
