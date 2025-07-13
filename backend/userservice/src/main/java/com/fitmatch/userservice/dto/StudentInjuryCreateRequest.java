package com.fitmatch.userservice.dto;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class StudentInjuryCreateRequest {

    @NotBlank
    private UUID user_id;

    @NotBlank(message = "injuryType 不能为空")
    private String injuryType;

    private String customInjuryType;

    private List<String> injuryTag;  // ✅ 这里改成 List<String>

    private Boolean isVisibleToCoach = true;
}
