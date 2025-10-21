package com.fitmatch.bookingservice.dto;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

/**
 * Availability Booking Request DTO
 * 用于availability预约请求
 */
public class AvailabilityBookingRequest {
    
    @NotNull(message = "Availability ID is required")
    private UUID availabilityId;
    
    @NotNull(message = "Student ID is required")
    private UUID studentId;
    
    @NotNull(message = "User course package ID is required")
    private UUID userCoursePackageId;
    
    @NotNull(message = "Start time is required")
    private Instant startTime;
    
    @NotNull(message = "End time is required")
    private Instant endTime;
    
    // Constructors
    public AvailabilityBookingRequest() {}
    
    public AvailabilityBookingRequest(UUID availabilityId, UUID studentId, UUID userCoursePackageId, 
                                    Instant startTime, Instant endTime) {
        this.availabilityId = availabilityId;
        this.studentId = studentId;
        this.userCoursePackageId = userCoursePackageId;
        this.startTime = startTime;
        this.endTime = endTime;
    }
    
    // Getters and Setters
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
    
    @Override
    public String toString() {
        return "AvailabilityBookingRequest{" +
                "availabilityId=" + availabilityId +
                ", studentId=" + studentId +
                ", userCoursePackageId=" + userCoursePackageId +
                ", startTime=" + startTime +
                ", endTime=" + endTime +
                '}';
    }
}
