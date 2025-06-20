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

    @NotBlank(message = "isFor 不能为空")
    private String isFor;              // "self", "child", "other"

    @NotBlank(message = "gender 不能为空")
    private String gender;             // "M", "F", "O", "U"

    @NotNull(message = "birthday 不能为空")
    private LocalDate birthday;

    @NotBlank(message = "country 不能为空")
    private String country;

    @NotBlank(message = "city 不能为空")
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

    // Getters and setters
}