package com.fitmatch.authservice.controller;

import com.fitmatch.authservice.dto.ConfirmRegisterRequest;
import com.fitmatch.authservice.dto.LoginRequest;
import com.fitmatch.authservice.dto.RegisterRequest;
import com.fitmatch.authservice.dto.ResetPasswordRequest;
import com.fitmatch.authservice.dto.LoginResponse;
import com.fitmatch.authservice.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        authService.initRegister(request);
        return ResponseEntity.ok(Map.of("message", "The verification code has been sent. Please check your email"));
    }

    @PostMapping("/confirm-register")
    public ResponseEntity<LoginResponse> confirmRegister(
            @Valid @RequestBody ConfirmRegisterRequest request) {

        LoginResponse response = authService.confirmRegister(request.getEmail(), request.getCode());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        authService.forgotPassword(email);
        return ResponseEntity.ok(Map.of("message", "The verification code has been sent. Please check your email"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<LoginResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        LoginResponse response = authService.resetPassword(request);
        return ResponseEntity.ok(response);
    }
}
