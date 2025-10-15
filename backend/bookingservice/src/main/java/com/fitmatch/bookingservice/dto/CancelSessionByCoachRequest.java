package com.fitmatch.bookingservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CancelSessionByCoachRequest {
    
    @NotNull
    private UUID eventId;
}
