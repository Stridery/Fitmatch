package com.fitmatch.courseservice.controller;

import com.fitmatch.courseservice.dto.CreateAvailabilityRequest;
import com.fitmatch.courseservice.entity.CoachCalendarEvent;
import com.fitmatch.courseservice.service.CoachCalendarService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CoachCalendarController.class)
class CoachCalendarControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CoachCalendarService calendarService;

    @Test
    void testCreateAvailability() throws Exception {
        // 准备测试数据
        UUID coachId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        LocalDateTime startTime = LocalDateTime.now().plusHours(1);
        LocalDateTime endTime = LocalDateTime.now().plusHours(2);

        CoachCalendarEvent mockEvent = new CoachCalendarEvent();
        mockEvent.setId(eventId);
        mockEvent.setCoachId(coachId);
        mockEvent.setKind("availability");
        mockEvent.setTitle("Test Availability");
        mockEvent.setStartTs(startTime);
        mockEvent.setEndTs(endTime);

        when(calendarService.createAvailability(any(CreateAvailabilityRequest.class)))
            .thenReturn(mockEvent);

        // 执行测试
        String requestJson = """
            {
                "coachId": "%s",
                "title": "Test Availability",
                "location": "Test Location",
                "startTs": "%s",
                "endTs": "%s",
                "courseIds": []
            }
            """.formatted(coachId, startTime, endTime);

        mockMvc.perform(post("/api/coach/calendar/availability")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(eventId.toString()))
                .andExpect(jsonPath("$.coachId").value(coachId.toString()))
                .andExpect(jsonPath("$.kind").value("availability"))
                .andExpect(jsonPath("$.title").value("Test Availability"));
    }
}
