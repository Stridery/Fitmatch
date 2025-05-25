package com.fitmatch.authservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConfirmRegisterRequest {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String code;
}
