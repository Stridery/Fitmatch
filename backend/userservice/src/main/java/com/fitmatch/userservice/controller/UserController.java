package com.fitmatch.userservice.controller;

import com.fitmatch.userservice.dto.*;
import com.fitmatch.userservice.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class UserController{

    private final UserService userService;

    @PostMapping("/set-profile")
    public ResponseEntity<?> saveOrUpdateProfile(@RequestBody @Valid UserProfileRequest request, 
                                            @RequestHeader("X-User-Id") String userId){
        userService.saveOrUpdateProfile(request, userId);
        return ResponseEntity.ok(Map.of("message", "Profile Saved"));
    }

    @DeleteMapping("/delete-profile")
    public ResponseEntity<Void> deleteUserProfile(@RequestHeader("X-User-Id") String userIdStr) {
        userService.deleteUserProfile(userIdStr);
        return ResponseEntity.noContent().build();
    }

    // UserController.java
    @GetMapping("/get-profile")
    public ResponseEntity<UserProfileResponse> getUserProfile(@RequestHeader("X-User-Id") String userIdStr) {
        UserProfileResponse profile = userService.getUserProfile(userIdStr);
        return ResponseEntity.ok(profile);
    }
}