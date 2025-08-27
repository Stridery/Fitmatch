package com.fitmatch.userservice.controller;

import com.fitmatch.userservice.dto.UserProfileRequest;
import com.fitmatch.userservice.dto.UserProfileResponse;
import com.fitmatch.userservice.service.UserService;
import com.fitmatch.userservice.dto.PublicUserDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

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

    @GetMapping("/search")
    public ResponseEntity<?> searchUsers(@RequestParam("q") String q,
                                         @RequestParam(value = "limit", required = false, defaultValue = "20") int limit) {
        List<PublicUserDto> users = userService.searchUsersByNickname(q, limit);
        return ResponseEntity.ok(Map.of("users", users));
    }
}