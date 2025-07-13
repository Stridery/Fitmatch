package com.fitmatch.userservice.dto;

import java.time.LocalDate;
import java.util.Map;
import lombok.Data;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;




@Data
public class UserProfileRequest {

    private String avatarUrl;

    @NotBlank(message = "Please input a nickname")
    private String nickname;

    private String phone;

    @NotBlank(message = "Please choose a registranr")
    private String isFor;              // "self", "child", "other"

    @NotBlank(message = "Please choose a gender")
    private String gender;             // "M", "F", "O", "U"

    @NotNull(message = "Please input your birthday")
    private LocalDate birthday;

    @NotBlank(message = "Please choose your country")
    private String country;

    @NotBlank(message = "Please choose your city")
    private String city;

    @Min(0)  // 身高限制可根据实际需求调整
    @Max(250)
    private Integer heightCm;

    @Min(0)
    @Max(300)
    private Integer weightKg;

    @Size(max = 30)
    private String currentTrainingFrequency;  // 枚举值：如 "每周1-2次"

    private String mbtiType;           // 可选
    private Map<String, Object> behavioralAnswers; // 可选（例如 {"q1":"A", "q2":"B"}）

    private boolean isCoach;

    private boolean isVenue;

    // Getters and setters
}