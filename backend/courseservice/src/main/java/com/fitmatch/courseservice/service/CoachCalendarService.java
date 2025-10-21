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
        validateTimeRange(request.getStartTsAsLocalDateTime(), request.getEndTsAsLocalDateTime());
        
        // 2. 检查时间冲突
        if (calendarEventRepository.hasTimeConflict(request.getCoachId(), 
            request.getStartTsAsLocalDateTime(), request.getEndTsAsLocalDateTime())) {
            throw new IllegalArgumentException("Time conflict detected. Please choose a different time slot.");
        }
        
        // 3. 创建calendar event
        CoachCalendarEvent event = new CoachCalendarEvent();
        event.setCoachId(request.getCoachId());
        event.setKind("availability");
        event.setCourseId(null); // availability的course_id设为null
        event.setTitle(request.getTitle());
        event.setLocation(request.getLocation());
        event.setStartTs(request.getStartTsAsLocalDateTime()); // 转换为UTC LocalDateTime
        event.setEndTs(request.getEndTsAsLocalDateTime()); // 转换为UTC LocalDateTime
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
        validateTimeRange(request.getStartTsAsLocalDateTime(), request.getEndTsAsLocalDateTime());
        
        // 5. 检查时间冲突（排除当前事件）
        if (calendarEventRepository.hasTimeConflict(request.getCoachId(), request.getAvailabilityId(), 
            request.getStartTsAsLocalDateTime(), request.getEndTsAsLocalDateTime())) {
            throw new IllegalArgumentException("Time conflict detected. Please choose a different time slot.");
        }
        
        // 6. 更新事件信息
        existingEvent.setTitle(request.getTitle());
        existingEvent.setLocation(request.getLocation());
        existingEvent.setStartTs(request.getStartTsAsLocalDateTime()); // 转换为UTC LocalDateTime
        existingEvent.setEndTs(request.getEndTsAsLocalDateTime()); // 转换为UTC LocalDateTime
        
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
     * 获取availability的关联课程
     */
    public List<AvailabilityCourse> getAvailabilityCourses(UUID availabilityId) {
        return availabilityCourseRepository.findByAvailabilityId(availabilityId);
    }
    
    /**
     * 验证时间范围
     */
    private void validateTimeRange(LocalDateTime startTs, LocalDateTime endTs) {
        if (startTs == null || endTs == null) {
            throw new IllegalArgumentException("Start time and end time are required");
        }
        
        if (!startTs.isBefore(endTs)) {
            throw new IllegalArgumentException("Start time must be before end time");
        }
        
        if (startTs.isBefore(LocalDateTime.now(ZoneOffset.UTC))) {
            throw new IllegalArgumentException("Start time cannot be in the past");
        }
        
        // 检查最小时长（30分钟）
        long durationMinutes = java.time.Duration.between(startTs, endTs).toMinutes();
        if (durationMinutes < 30) {
            throw new IllegalArgumentException("Availability duration must be at least 30 minutes");
        }
    }
    
    /**
     * 创建availability-course关联
     */
    private void createAvailabilityCourseAssociations(UUID availabilityId, List<UUID> courseIds) {
        log.info("Creating course associations for availability: {}, courses: {}", availabilityId, courseIds);
        for (UUID courseId : courseIds) {
            AvailabilityCourse association = new AvailabilityCourse();
            association.setAvailabilityId(availabilityId);
            association.setCourseId(courseId);
            AvailabilityCourse saved = availabilityCourseRepository.save(association);
            log.info("Created course association: {} for availability: {} and course: {}", 
                saved.getId(), availabilityId, courseId);
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
