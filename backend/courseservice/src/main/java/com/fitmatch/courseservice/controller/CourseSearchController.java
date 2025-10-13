package com.fitmatch.courseservice.controller;

import com.fitmatch.courseservice.dto.CourseCardDto;
import com.fitmatch.courseservice.dto.CourseSearchRequest;
import com.fitmatch.courseservice.dto.CourseSearchResponse;
import com.fitmatch.courseservice.repository.CourseSearchRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/courses")
public class CourseSearchController {
    
    private final CourseSearchRepository repository;
    
    public CourseSearchController(CourseSearchRepository repository) {
        this.repository = repository;
    }
    
    @GetMapping("/search")
    public CourseSearchResponse search(
            CourseSearchRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        
        // 如果用户已登录，自动排除用户自己创建的课程
        if (userId != null && !userId.isEmpty()) {
            request.setExcludeCoachId(userId);
        }
        
        // 执行查询
        var results = repository.search(request);
        var total = repository.count(request);
        
        // 转换结果
        List<CourseCardDto> dtos = results.stream()
            .map(view -> {
                CourseCardDto dto = new CourseCardDto();
                dto.setCourseId(view.getCourseId() != null ? view.getCourseId().toString() : null);
                dto.setCourseTitle(view.getCourseTitle());
                dto.setSportName(view.getSportName());
                dto.setCoachName(view.getCoachName());
                dto.setCoachNickname(view.getCoachName());
                dto.setCity(view.getCity());
                dto.setCertificates(view.getHasCertificate() && view.getCertificateType() != null 
                    ? List.of(view.getCertificateType()) 
                    : List.of());
                dto.setPricePerLessonMin(view.getPricePerLessonMin());
                dto.setStyles(view.getStyles());
                dto.setCommStyles(view.getCommStyles());
                dto.setPaceIntensities(view.getPaceIntensities());
                dto.setPreferStudents(view.getPreferStudents());
                dto.setMatchScore(view.getMatchScore());
                return dto;
            })
            .toList();
        
        return CourseSearchResponse.of(
            dtos,
            request.getValidPage(),
            request.getValidSize(),
            total
        );
    }
}