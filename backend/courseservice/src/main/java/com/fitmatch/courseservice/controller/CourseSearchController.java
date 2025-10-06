package com.fitmatch.courseservice.controller;

import com.fitmatch.courseservice.dto.CourseCardDto;
import com.fitmatch.courseservice.dto.CourseSearchRequest;
import com.fitmatch.courseservice.dto.CourseSearchResponse;
import com.fitmatch.courseservice.entity.CourseSearchView;
import com.fitmatch.courseservice.repository.CourseSearchRepository;
import org.springframework.web.bind.annotation.GetMapping;
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
    public CourseSearchResponse search(CourseSearchRequest request) {
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
                dto.setPricePerSession(view.getPricePerLessonMin());
                dto.setPricePerHour(view.getPricePerHourMin());
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