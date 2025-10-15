package com.fitmatch.bookingservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class BookingRequest {
    
    @NotNull(message = "Event ID is required")
    private UUID eventId;
    
    @NotNull(message = "User course package ID is required")
    private UUID userCoursePackageId;
}
