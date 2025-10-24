package com.fitmatch.bookingservice.service;

import com.fitmatch.bookingservice.dto.CoursePackagePriceDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
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
            
            // 使用 Map 接收响应，因为 Course Service 返回的 id 和 courseId 是 String 类型
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            
            if (response != null) {
                CoursePackagePriceDto dto = new CoursePackagePriceDto();
                dto.setId(UUID.fromString((String) response.get("id")));
                dto.setCourseId(UUID.fromString((String) response.get("courseId")));
                dto.setLessonsCount((Integer) response.get("lessonsCount"));
                dto.setLessonDurationMinutes((Integer) response.get("lessonDurationMinutes"));
                dto.setPrice(new java.math.BigDecimal(response.get("price").toString()));
                dto.setTrainingMode((String) response.get("trainingMode"));
                
                log.info("Fetched package price: {} lessons", dto.getLessonsCount());
                return dto;
            } else {
                log.warn("Course service returned null for package: {}", packagePriceId);
            }
            
        } catch (Exception e) {
            log.error("Course service unavailable, error: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch package price from course service: " + e.getMessage(), e);
        }
        
        // 如果到这里说明没有返回数据，抛出异常
        throw new RuntimeException("Course service returned null for package: " + packagePriceId);
    }
}
