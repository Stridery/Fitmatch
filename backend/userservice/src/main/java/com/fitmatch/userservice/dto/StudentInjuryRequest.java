package com.fitmatch.userservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class StudentInjuryRequest {

    @NotBlank(message = "injuryType 不能为空")
    private String injuryType;

    private String customInjuryType;

    private String injuryTag;

    private Boolean isVisibleToCoach = true;  // 可选，默认 true

    // 不需要 createdAt 和 @PrePersist，数据库自动生成
}
