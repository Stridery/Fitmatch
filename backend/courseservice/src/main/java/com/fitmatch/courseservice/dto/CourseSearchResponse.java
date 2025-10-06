package com.fitmatch.courseservice.dto;

import lombok.Data;
import java.util.List;

@Data
public class CourseSearchResponse {
    private List<CourseCardDto> items;
    private int page;
    private int size;
    private long total;
    
    public static CourseSearchResponse of(List<CourseCardDto> items, int page, int size, long total) {
        CourseSearchResponse response = new CourseSearchResponse();
        response.setItems(items);
        response.setPage(page);
        response.setSize(size);
        response.setTotal(total);
        return response;
    }
}


