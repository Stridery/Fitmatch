package com.fitmatch.bookingservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ExitWaitlistRequest {
    
    @NotNull
    private UUID eventId;
}
