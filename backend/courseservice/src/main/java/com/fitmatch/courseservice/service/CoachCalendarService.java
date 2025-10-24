package com.fitmatch.courseservice.service;

import com.fitmatch.courseservice.dto.CreateAvailabilityRequest;
import com.fitmatch.courseservice.dto.UpdateAvailabilityRequest;
import com.fitmatch.courseservice.entity.AvailabilityCourse;
import com.fitmatch.courseservice.entity.CoachCalendarEvent;
import com.fitmatch.courseservice.repository.AvailabilityCourseRepository;
import com.fitmatch.courseservice.repository.CoachCalendarEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CoachCalendarService {
    
    private final CoachCalendarEventRepository calendarEventRepository;
    private final AvailabilityCourseRepository availabilityCourseRepository;
    
    /**
     * 创建availability事件
     */
    @Transactional
    public CoachCalendarEvent createAvailability(CreateAvailabilityRequest request) {
        log.info("Creating availability for coach: {}, title: {}, courseIds: {}", 
            request.getCoachId(), request.getTitle(), request.getCourseIds());
        
        // 1. 验证时间
        validateTimeRange(request.getStartTs(), request.getEndTs());
        
        // 2. 检查时间冲突
        LocalDateTime startTime = parseUtcTimeString(request.getStartTs());
        LocalDateTime endTime = parseUtcTimeString(request.getEndTs());
        if (calendarEventRepository.hasTimeConflict(request.getCoachId(), startTime, endTime)) {
            throw new IllegalArgumentException("Time conflict detected. Please choose a different time slot.");
        }
        
        // 3. 创建calendar event
        CoachCalendarEvent event = new CoachCalendarEvent();
        event.setCoachId(request.getCoachId());
        event.setKind("availability");
        event.setCourseId(null); // availability的course_id设为null
        event.setTitle(request.getTitle());
        event.setLocation(request.getLocation());
        event.setStartTs(startTime); // 转换为UTC LocalDateTime
        event.setEndTs(endTime); // 转换为UTC LocalDateTime
        event.setCapacity(null); // availability不需要capacity
        event.setBookedCount(0);
        
        CoachCalendarEvent savedEvent = calendarEventRepository.save(event);
        log.info("Created calendar event with ID: {}", savedEvent.getId());
        
        // 4. 创建availability-course关联
        if (request.getCourseIds() != null && !request.getCourseIds().isEmpty()) {
            createAvailabilityCourseAssociations(savedEvent.getId(), request.getCourseIds());
            log.info("Created {} course associations for availability: {}", 
                request.getCourseIds().size(), savedEvent.getId());
        }
        
        return savedEvent;
    }
    
    /**
     * 更新availability事件
     */
    @Transactional
    public CoachCalendarEvent updateAvailability(UpdateAvailabilityRequest request) {
        log.info("Updating availability: {} for coach: {}", request.getAvailabilityId(), request.getCoachId());
        
        // 1. 查找现有事件
        CoachCalendarEvent existingEvent = calendarEventRepository.findById(request.getAvailabilityId())
            .orElseThrow(() -> new IllegalArgumentException("Availability not found"));
        
        // 2. 验证教练权限
        if (!existingEvent.getCoachId().equals(request.getCoachId())) {
            throw new IllegalArgumentException("You don't have permission to update this availability");
        }
        
        // 3. 验证事件类型
        if (!"availability".equals(existingEvent.getKind())) {
            throw new IllegalArgumentException("Event is not an availability");
        }
        
        // 4. 验证时间
        validateTimeRange(request.getStartTs(), request.getEndTs());
        
        // 5. 检查时间冲突（排除当前事件）
        LocalDateTime startTime = parseUtcTimeString(request.getStartTs());
        LocalDateTime endTime = parseUtcTimeString(request.getEndTs());
        if (calendarEventRepository.hasTimeConflict(request.getCoachId(), request.getAvailabilityId(), 
            startTime, endTime)) {
            throw new IllegalArgumentException("Time conflict detected. Please choose a different time slot.");
        }
        
        // 6. 更新事件信息
        existingEvent.setTitle(request.getTitle());
        existingEvent.setLocation(request.getLocation());
        existingEvent.setStartTs(startTime); // 转换为UTC LocalDateTime
        existingEvent.setEndTs(endTime); // 转换为UTC LocalDateTime
        
        CoachCalendarEvent updatedEvent = calendarEventRepository.save(existingEvent);
        log.info("Updated calendar event: {}", updatedEvent.getId());
        
        // 7. 更新课程关联
        updateAvailabilityCourseAssociations(request.getAvailabilityId(), request.getCourseIds());
        log.info("Updated course associations for availability: {}", request.getAvailabilityId());
        
        return updatedEvent;
    }
    
    /**
     * 删除availability事件
     */
    @Transactional
    public void deleteAvailability(UUID availabilityId, UUID coachId) {
        log.info("Deleting availability: {} for coach: {}", availabilityId, coachId);
        
        // 1. 查找现有事件
        CoachCalendarEvent existingEvent = calendarEventRepository.findById(availabilityId)
            .orElseThrow(() -> new IllegalArgumentException("Availability not found"));
        
        // 2. 验证教练权限
        if (!existingEvent.getCoachId().equals(coachId)) {
            throw new IllegalArgumentException("You don't have permission to delete this availability");
        }
        
        // 3. 验证事件类型
        if (!"availability".equals(existingEvent.getKind())) {
            throw new IllegalArgumentException("Event is not an availability");
        }
        
        // 4. 删除课程关联
        availabilityCourseRepository.deleteByAvailabilityId(availabilityId);
        log.info("Deleted course associations for availability: {}", availabilityId);
        
        // 5. 删除事件
        calendarEventRepository.delete(existingEvent);
        log.info("Deleted availability: {}", availabilityId);
    }
    
    /**
     * 获取教练的availability列表
     */
    public List<CoachCalendarEvent> getCoachAvailabilities(UUID coachId) {
        return calendarEventRepository.findByCourseIdAndKindOrderByStartTsAsc(null, "availability")
            .stream()
            .filter(event -> event.getCoachId().equals(coachId))
            .toList();
    }
    
    /**
     * 获取教练的availability列表（按时间范围过滤）
     */
    public List<CoachCalendarEvent> getCoachAvailabilities(UUID coachId, LocalDateTime startTime, LocalDateTime endTime) {
        return calendarEventRepository.findByCoachIdAndTimeRange(coachId, startTime, endTime)
            .stream()
            .filter(event -> "availability".equals(event.getKind()))
            .toList();
    }
    
    /**
     * 获取availability的关联课程
     */
    public List<AvailabilityCourse> getAvailabilityCourses(UUID availabilityId) {
        return availabilityCourseRepository.findByAvailabilityId(availabilityId);
    }
    
    /**
     * 解析UTC时间字符串为LocalDateTime（用于存储到数据库）
     */
    private LocalDateTime parseUtcTimeString(String utcTimeString) {
        try {
            // 直接解析UTC时间字符串，格式：2024-01-15T18:00:00.000Z
            return LocalDateTime.ofInstant(
                java.time.Instant.parse(utcTimeString),
                ZoneOffset.UTC
            );
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid UTC time format: " + utcTimeString);
        }
    }
    
    /**
     * 验证时间范围（简化版本，只做基本验证）
     */
    private void validateTimeRange(String startTs, String endTs) {
        if (startTs == null || endTs == null || startTs.isEmpty() || endTs.isEmpty()) {
            throw new IllegalArgumentException("Start time and end time are required");
        }
        
        // 基本格式验证
        if (!startTs.contains("T") || !endTs.contains("T")) {
            throw new IllegalArgumentException("Invalid time format");
        }
        
        // 暂时跳过其他验证，专注于解决时区转换问题
        // TODO: 实现更完整的时间验证
    }
    
    /**
     * 创建availability-course关联
     */
    private void createAvailabilityCourseAssociations(UUID availabilityId, List<UUID> courseIds) {
        log.info("Creating course associations for availability: {}, courses: {}", availabilityId, courseIds);
        for (UUID courseId : courseIds) {
            // 使用原生SQL插入，避免JPA实体映射问题
            availabilityCourseRepository.insertAvailabilityCourse(availabilityId, courseId);
            log.info("Created course association for availability: {} and course: {}", availabilityId, courseId);
        }
    }
    
    /**
     * 更新availability-course关联
     */
    private void updateAvailabilityCourseAssociations(UUID availabilityId, List<UUID> courseIds) {
        // 1. 删除现有关联
        availabilityCourseRepository.deleteByAvailabilityId(availabilityId);
        
        // 2. 创建新关联
        if (courseIds != null && !courseIds.isEmpty()) {
            createAvailabilityCourseAssociations(availabilityId, courseIds);
        }
    }
}
