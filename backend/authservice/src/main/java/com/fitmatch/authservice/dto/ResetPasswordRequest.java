package com.fitmatch.authservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @Email(message = "Please enter a valid email address")
    @NotBlank(message = "Email cannot be blank")
    private String email;

    @NotBlank
    private String code;

    @NotBlank(message = "Please enter a valid email address")
    @Size(min = 8, max = 32, message = "Password must be between 8 and 32 characters long")
    @Pattern(
        regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@$!%*?&()_+=-]{8,}$",
        message = "Password must contain both letters and numbers, and may include special characters"
    )
    private String newpassword;
}