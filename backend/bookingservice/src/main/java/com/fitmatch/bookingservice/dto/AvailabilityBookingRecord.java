package com.fitmatch.bookingservice.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Availability预约记录DTO
 */
public class AvailabilityBookingRecord {
    private UUID studentId;
    private UUID coachId;
    private UUID userCoursePackageId;
    private UUID availabilityEventId;
    private String title;
    private Instant bookedStartTime;
    private Instant bookedEndTime;
    private String bookingStatus;
    private Instant bookedAt;
    private Instant cancelledAt;
    private String location;

    // Constructors
    public AvailabilityBookingRecord() {}

    public AvailabilityBookingRecord(UUID studentId, UUID coachId, UUID userCoursePackageId, 
                                   UUID availabilityEventId, String title, Instant bookedStartTime, 
                                   Instant bookedEndTime, String bookingStatus, Instant bookedAt, 
                                   Instant cancelledAt, String location) {
        this.studentId = studentId;
        this.coachId = coachId;
        this.userCoursePackageId = userCoursePackageId;
        this.availabilityEventId = availabilityEventId;
        this.title = title;
        this.bookedStartTime = bookedStartTime;
        this.bookedEndTime = bookedEndTime;
        this.bookingStatus = bookingStatus;
        this.bookedAt = bookedAt;
        this.cancelledAt = cancelledAt;
        this.location = location;
    }

    // Getters and Setters
    public UUID getStudentId() {
        return studentId;
    }

    public void setStudentId(UUID studentId) {
        this.studentId = studentId;
    }

    public UUID getCoachId() {
        return coachId;
    }

    public void setCoachId(UUID coachId) {
        this.coachId = coachId;
    }

    public UUID getUserCoursePackageId() {
        return userCoursePackageId;
    }

    public void setUserCoursePackageId(UUID userCoursePackageId) {
        this.userCoursePackageId = userCoursePackageId;
    }

    public UUID getAvailabilityEventId() {
        return availabilityEventId;
    }

    public void setAvailabilityEventId(UUID availabilityEventId) {
        this.availabilityEventId = availabilityEventId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Instant getBookedStartTime() {
        return bookedStartTime;
    }

    public void setBookedStartTime(Instant bookedStartTime) {
        this.bookedStartTime = bookedStartTime;
    }

    public Instant getBookedEndTime() {
        return bookedEndTime;
    }

    public void setBookedEndTime(Instant bookedEndTime) {
        this.bookedEndTime = bookedEndTime;
    }

    public String getBookingStatus() {
        return bookingStatus;
    }

    public void setBookingStatus(String bookingStatus) {
        this.bookingStatus = bookingStatus;
    }

    public Instant getBookedAt() {
        return bookedAt;
    }

    public void setBookedAt(Instant bookedAt) {
        this.bookedAt = bookedAt;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(Instant cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    @Override
    public String toString() {
        return "AvailabilityBookingRecord{" +
                "studentId=" + studentId +
                ", coachId=" + coachId +
                ", userCoursePackageId=" + userCoursePackageId +
                ", availabilityEventId=" + availabilityEventId +
                ", title='" + title + '\'' +
                ", bookedStartTime=" + bookedStartTime +
                ", bookedEndTime=" + bookedEndTime +
                ", bookingStatus='" + bookingStatus + '\'' +
                ", bookedAt=" + bookedAt +
                ", cancelledAt=" + cancelledAt +
                ", location='" + location + '\'' +
                '}';
    }
}
