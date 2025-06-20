package com.fitmatch.userservice.controller;

import com.fitmatch.userservice.dto.StudentInjuryRequest;
import com.fitmatch.userservice.dto.StudentInjuryResponse;
import com.fitmatch.userservice.service.StudentInjuryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/profile/injuries")
@RequiredArgsConstructor
public class StudentInjuryController {

    private final StudentInjuryService studentInjuryService;

    // 从 Header 中读取用户 ID（由 JWT Filter 添加）
    private UUID extractUserIdFromHeader(String userIdHeader) {
        try {
            return UUID.fromString(userIdHeader);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid or missing X-User-Id header");
        }
    }

    @PostMapping
    public ResponseEntity<StudentInjuryResponse> create(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody StudentInjuryRequest request
    ) {
        return ResponseEntity.ok(studentInjuryService.createInjury(request, extractUserIdFromHeader(userId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StudentInjuryResponse> update(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody StudentInjuryRequest request
    ) {
        return ResponseEntity.ok(studentInjuryService.updateInjury(id, request, extractUserIdFromHeader(userId)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") String userId
    ) {
        studentInjuryService.deleteInjury(id, extractUserIdFromHeader(userId));
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<StudentInjuryResponse>> getAll(
            @RequestHeader("X-User-Id") String userId
    ) {
        return ResponseEntity.ok(studentInjuryService.getAllInjuries(extractUserIdFromHeader(userId)));
    }
}
