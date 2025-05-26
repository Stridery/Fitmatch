package com.fitmatch.authservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConfirmRegisterRequest {

    @Email(message = "Please enter a valid email address")
    @NotBlank(message = "Email cannot be blank")
    private String email;

    @NotBlank
    private String code;
}
