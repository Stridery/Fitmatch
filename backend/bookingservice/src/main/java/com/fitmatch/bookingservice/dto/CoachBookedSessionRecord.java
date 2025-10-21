package com.fitmatch.bookingservice.dto;

import java.util.List;
import java.util.UUID;

/**
 * 教练有学生的课程记录DTO
 */
public class CoachBookedSessionRecord {
    private UUID id;
    private String kind; // 'session' or 'availability'
    private String title;
    private UUID courseId;
    private String courseName;
    private String location;
    private String startTime;
    private String endTime;
    private int studentCount;
    private Integer maxCapacity;
    private List<String> studentNames;

    // Constructors
    public CoachBookedSessionRecord() {}

    public CoachBookedSessionRecord(UUID id, String kind, String title, UUID courseId, 
                                  String courseName, String location, String startTime, 
                                  String endTime, int studentCount, Integer maxCapacity, 
                                  List<String> studentNames) {
        this.id = id;
        this.kind = kind;
        this.title = title;
        this.courseId = courseId;
        this.courseName = courseName;
        this.location = location;
        this.startTime = startTime;
        this.endTime = endTime;
        this.studentCount = studentCount;
        this.maxCapacity = maxCapacity;
        this.studentNames = studentNames;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getKind() {
        return kind;
    }

    public void setKind(String kind) {
        this.kind = kind;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public UUID getCourseId() {
        return courseId;
    }

    public void setCourseId(UUID courseId) {
        this.courseId = courseId;
    }

    public String getCourseName() {
        return courseName;
    }

    public void setCourseName(String courseName) {
        this.courseName = courseName;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public int getStudentCount() {
        return studentCount;
    }

    public void setStudentCount(int studentCount) {
        this.studentCount = studentCount;
    }

    public Integer getMaxCapacity() {
        return maxCapacity;
    }

    public void setMaxCapacity(Integer maxCapacity) {
        this.maxCapacity = maxCapacity;
    }

    public List<String> getStudentNames() {
        return studentNames;
    }

    public void setStudentNames(List<String> studentNames) {
        this.studentNames = studentNames;
    }

    @Override
    public String toString() {
        return "CoachBookedSessionRecord{" +
                "id=" + id +
                ", kind='" + kind + '\'' +
                ", title='" + title + '\'' +
                ", courseId=" + courseId +
                ", courseName='" + courseName + '\'' +
                ", location='" + location + '\'' +
                ", startTime='" + startTime + '\'' +
                ", endTime='" + endTime + '\'' +
                ", studentCount=" + studentCount +
                ", maxCapacity=" + maxCapacity +
                ", studentNames=" + studentNames +
                '}';
    }
}
