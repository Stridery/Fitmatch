package com.fitmatch.userservice.dto;

import lombok.*;
import java.time.LocalDate;
import java.sql.Timestamp;
import java.util.Map;
import java.util.UUID;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private UUID id;
    private UUID userId;

    private String avatarUrl;
    private String nickname;
    private String phone;
    private String isFor;
    private String gender;
    private LocalDate birthday;
    private String country;
    private String city;
    private String mbtiType;
    private Map<String, Object> behavioralAnswers;
    private Integer heightCm;
    private Integer weightKg;
    private String currentTrainingFrequency;
    private Timestamp updatedAt;
    private Boolean isCoach;
    private Boolean isVenue;
}
