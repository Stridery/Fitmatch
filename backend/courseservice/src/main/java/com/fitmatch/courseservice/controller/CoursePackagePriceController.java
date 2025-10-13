package com.fitmatch.courseservice.controller;

import com.fitmatch.courseservice.dto.CoursePackagePriceDto;
import com.fitmatch.courseservice.dto.CoursePackagePriceRequest;
import com.fitmatch.courseservice.entity.CoursePackagePrice;
import com.fitmatch.courseservice.repository.CoursePackagePriceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/courses/packages")
public class CoursePackagePriceController {
    
    private final CoursePackagePriceRepository repository;
    
    public CoursePackagePriceController(CoursePackagePriceRepository repository) {
        this.repository = repository;
    }
    
    /**
     * 根据课程ID获取包价格列表
     */
    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<CoursePackagePriceDto>> getPackagesByCourseId(@PathVariable String courseId) {
        UUID courseUuid = UUID.fromString(courseId);
        List<CoursePackagePrice> packages = repository.findByCourseIdOrderByCreatedAtAsc(courseUuid);
        List<CoursePackagePriceDto> dtos = packages.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    /**
     * 批量获取多个课程的包价格
     */
    @PostMapping("/batch")
    public ResponseEntity<List<CoursePackagePriceDto>> getPackagesByCourseIds(@RequestBody List<String> courseIds) {
        List<UUID> courseUuids = courseIds.stream()
            .map(UUID::fromString)
            .collect(Collectors.toList());
        List<CoursePackagePrice> packages = repository.findByCourseIdInOrderByCreatedAtAsc(courseUuids);
        List<CoursePackagePriceDto> dtos = packages.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    /**
     * 保存课程的包价格（替换策略）
     */
    @PostMapping("/save")
    @Transactional
    public ResponseEntity<String> savePackages(@RequestBody CoursePackagePriceRequest request) {
        try {
            UUID courseUuid = UUID.fromString(request.getCourseId());
            // 1. 删除现有包
            repository.deleteByCourseId(courseUuid);
            
            // 2. 保存新包
            if (request.getPackages() != null && !request.getPackages().isEmpty()) {
                List<CoursePackagePrice> newPackages = request.getPackages().stream()
                    .map(pkg -> {
                        CoursePackagePrice entity = new CoursePackagePrice();
                        entity.setCourseId(courseUuid);
                        entity.setLessonsCount(pkg.getLessons_count());
                        entity.setLessonDurationMinutes(pkg.getLesson_duration_minutes());
                        entity.setPrice(pkg.getPrice());
                        entity.setTrainingMode(pkg.getTraining_mode() != null ? pkg.getTraining_mode() : "1v1");
                        return entity;
                    })
                    .collect(Collectors.toList());
                
                repository.saveAll(newPackages);
            }
            
            return ResponseEntity.ok("Packages saved successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to save packages: " + e.getMessage());
        }
    }
    
    /**
     * 删除课程的所有包价格
     */
    @DeleteMapping("/course/{courseId}")
    @Transactional
    public ResponseEntity<String> deletePackagesByCourseId(@PathVariable String courseId) {
        try {
            UUID courseUuid = UUID.fromString(courseId);
            repository.deleteByCourseId(courseUuid);
            return ResponseEntity.ok("Packages deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to delete packages: " + e.getMessage());
        }
    }
    
    private CoursePackagePriceDto convertToDto(CoursePackagePrice entity) {
        CoursePackagePriceDto dto = new CoursePackagePriceDto();
        dto.setId(entity.getId().toString());
        dto.setCourseId(entity.getCourseId().toString());
        dto.setLessonsCount(entity.getLessonsCount());
        dto.setLessonDurationMinutes(entity.getLessonDurationMinutes());
        dto.setPrice(entity.getPrice());
        dto.setTrainingMode(entity.getTrainingMode());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}
