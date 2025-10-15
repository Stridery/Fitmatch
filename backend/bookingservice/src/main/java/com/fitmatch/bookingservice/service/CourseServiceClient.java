package com.fitmatch.bookingservice.service;

import com.fitmatch.bookingservice.dto.CoursePackagePriceDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CourseServiceClient {
    
    @Value("${course.service.url:http://localhost:8080}")
    private String courseServiceUrl;
    
    private final RestTemplate restTemplate;
    
    /**
     * 获取套餐价格信息
     */
    public CoursePackagePriceDto getPackagePrice(UUID packagePriceId) {
        try {
            log.info("Fetching package price from course service: {}", packagePriceId);
            
            String url = courseServiceUrl + "/courses/packages/" + packagePriceId;
            CoursePackagePriceDto result = restTemplate.getForObject(url, CoursePackagePriceDto.class);
            
            if (result != null) {
                log.info("Fetched package price: {} lessons", result.getLessonsCount());
                return result;
            } else {
                log.warn("Course service returned null for package: {}", packagePriceId);
            }
            
        } catch (Exception e) {
            log.warn("Course service unavailable, using default values: {}", e.getMessage());
        }
        
        // 返回默认值
        CoursePackagePriceDto defaultPackage = new CoursePackagePriceDto();
        defaultPackage.setId(packagePriceId);
        defaultPackage.setLessonsCount(6); // 默认6节课
        defaultPackage.setPrice(new java.math.BigDecimal("1000.00"));
        defaultPackage.setTrainingMode("1v1");
        defaultPackage.setLessonDurationMinutes(60);
        log.info("Using default package values: 6 lessons for package: {}", packagePriceId);
        return defaultPackage;
    }
}
