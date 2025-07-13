package com.fitmatch.userservice.controller;

import com.fitmatch.userservice.dto.UserProfileRequest;
import com.fitmatch.userservice.dto.UserProfileResponse;
import com.fitmatch.userservice.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/me")
    public ResponseEntity<?> saveOrUpdateProfile(
            @RequestBody @Valid UserProfileRequest request,
            @RequestHeader("X-User-Id") String userId
    ) {
        System.out.println(userId);
        userService.saveOrUpdateProfile(request, userId);
        return ResponseEntity.ok(Map.of("message", "Profile Saved"));
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteUserProfile(
            @RequestHeader("X-User-Id") String userId
    ) {
        userService.deleteUserProfile(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getUserProfile(
            @RequestHeader("X-User-Id") String userId
    ) {
        System.out.println(userId);
        UserProfileResponse profile = userService.getUserProfile(userId);
        return ResponseEntity.ok(profile);
    }
}