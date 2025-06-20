package com.fitmatch.userservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentInjuryResponse {

    private UUID id;

    private UUID userId;

    private String injuryType;

    private String customInjuryType;

    private String injuryTag;

    private Boolean isVisibleToCoach;

    private Timestamp createdAt;

    private Timestamp updatedAt;
}
