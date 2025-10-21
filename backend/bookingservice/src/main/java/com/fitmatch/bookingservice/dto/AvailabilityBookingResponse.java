package com.fitmatch.bookingservice.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Availability Booking Response DTO
 * 用于availability预约响应
 */
public class AvailabilityBookingResponse {
    
    private UUID bookingId;
    private UUID availabilityId;
    private UUID studentId;
    private UUID userCoursePackageId;
    private String status;
    private Instant startTime;
    private Instant endTime;
    private Instant bookedAt;
    private String message;
    
    // Constructors
    public AvailabilityBookingResponse() {}
    
    public AvailabilityBookingResponse(UUID bookingId, UUID availabilityId, UUID studentId, 
                                     UUID userCoursePackageId, String status, Instant startTime, 
                                     Instant endTime, Instant bookedAt, String message) {
        this.bookingId = bookingId;
        this.availabilityId = availabilityId;
        this.studentId = studentId;
        this.userCoursePackageId = userCoursePackageId;
        this.status = status;
        this.startTime = startTime;
        this.endTime = endTime;
        this.bookedAt = bookedAt;
        this.message = message;
    }
    
    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private UUID bookingId;
        private UUID availabilityId;
        private UUID studentId;
        private UUID userCoursePackageId;
        private String status;
        private Instant startTime;
        private Instant endTime;
        private Instant bookedAt;
        private String message;
        
        public Builder bookingId(UUID bookingId) {
            this.bookingId = bookingId;
            return this;
        }
        
        public Builder availabilityId(UUID availabilityId) {
            this.availabilityId = availabilityId;
            return this;
        }
        
        public Builder studentId(UUID studentId) {
            this.studentId = studentId;
            return this;
        }
        
        public Builder userCoursePackageId(UUID userCoursePackageId) {
            this.userCoursePackageId = userCoursePackageId;
            return this;
        }
        
        public Builder status(String status) {
            this.status = status;
            return this;
        }
        
        public Builder startTime(Instant startTime) {
            this.startTime = startTime;
            return this;
        }
        
        public Builder endTime(Instant endTime) {
            this.endTime = endTime;
            return this;
        }
        
        public Builder bookedAt(Instant bookedAt) {
            this.bookedAt = bookedAt;
            return this;
        }
        
        public Builder message(String message) {
            this.message = message;
            return this;
        }
        
        public AvailabilityBookingResponse build() {
            return new AvailabilityBookingResponse(
                bookingId, availabilityId, studentId, userCoursePackageId,
                status, startTime, endTime, bookedAt, message
            );
        }
    }
    
    // Getters and Setters
    public UUID getBookingId() {
        return bookingId;
    }
    
    public void setBookingId(UUID bookingId) {
        this.bookingId = bookingId;
    }
    
    public UUID getAvailabilityId() {
        return availabilityId;
    }
    
    public void setAvailabilityId(UUID availabilityId) {
        this.availabilityId = availabilityId;
    }
    
    public UUID getStudentId() {
        return studentId;
    }
    
    public void setStudentId(UUID studentId) {
        this.studentId = studentId;
    }
    
    public UUID getUserCoursePackageId() {
        return userCoursePackageId;
    }
    
    public void setUserCoursePackageId(UUID userCoursePackageId) {
        this.userCoursePackageId = userCoursePackageId;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public Instant getStartTime() {
        return startTime;
    }
    
    public void setStartTime(Instant startTime) {
        this.startTime = startTime;
    }
    
    public Instant getEndTime() {
        return endTime;
    }
    
    public void setEndTime(Instant endTime) {
        this.endTime = endTime;
    }
    
    public Instant getBookedAt() {
        return bookedAt;
    }
    
    public void setBookedAt(Instant bookedAt) {
        this.bookedAt = bookedAt;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    @Override
    public String toString() {
        return "AvailabilityBookingResponse{" +
                "bookingId=" + bookingId +
                ", availabilityId=" + availabilityId +
                ", studentId=" + studentId +
                ", userCoursePackageId=" + userCoursePackageId +
                ", status='" + status + '\'' +
                ", startTime=" + startTime +
                ", endTime=" + endTime +
                ", bookedAt=" + bookedAt +
                ", message='" + message + '\'' +
                '}';
    }
}
