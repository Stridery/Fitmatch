package com.fitmatch.bookingservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class PurchasePackageRequest {
    
    @NotNull(message = "Package price ID is required")
    private UUID packagePriceId;
    
    @NotNull(message = "Course ID is required")
    private UUID courseId;
    
    @NotNull(message = "Coach ID is required")
    private UUID coachId;
}
