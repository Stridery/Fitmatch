package com.fitmatch.authservice.controller;

import com.fitmatch.authservice.dto.ConfirmRegisterRequest;
import com.fitmatch.authservice.dto.LoginRequest;
import com.fitmatch.authservice.dto.RegisterRequest;
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
        return ResponseEntity.ok(Map.of("message", "验证码已发送，请查收邮箱"));
    }

    @PostMapping("/confirm-register")
    public ResponseEntity<?> confirmRegister(
            @Valid @RequestBody ConfirmRegisterRequest request) {

        String token = authService.confirmRegister(request.getEmail(), request.getCode());
        return ResponseEntity.ok(Map.of("token", token));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid LoginRequest request) {
        String token = authService.login(request);
        return ResponseEntity.ok(Map.of("token", token));
    }
}
