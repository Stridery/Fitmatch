package com.fitmatch.courseservice.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Data
@Entity
@Table(name = "coach_calendar_event")
public class CoachCalendarEvent {
    
    @Id
    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "id")
    private UUID id;
    
    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "coach_id", nullable = false)
    private UUID coachId;
    
    @Column(name = "kind", nullable = false)
    private String kind; // 'session' or 'availability'
    
    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "course_id")
    private UUID courseId; // null for availability, specific course for session
    
    @Column(name = "title")
    private String title;
    
    @Column(name = "location")
    private String location;
    
    @Column(name = "start_ts", nullable = false)
    private Instant startTs;
    
    @Column(name = "end_ts", nullable = false)
    private Instant endTs;
    
    @Column(name = "capacity")
    private Integer capacity;
    
    @Column(name = "booked_count", nullable = false)
    private Integer bookedCount = 0;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    
    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (bookedCount == null) {
            bookedCount = 0;
        }
    }
}
