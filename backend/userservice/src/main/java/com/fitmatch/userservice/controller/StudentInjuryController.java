package com.fitmatch.userservice.controller;

import com.fitmatch.userservice.dto.StudentInjuriesRequestBatch;
import com.fitmatch.userservice.dto.StudentInjuryResponse;
import com.fitmatch.userservice.service.StudentInjuryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class StudentInjuryController {

    private final StudentInjuryService studentInjuryService;

    @PostMapping("/injuries/batch")
    public ResponseEntity<List<StudentInjuryResponse>> batchUpdate(
            @RequestHeader("X-User-Id") String userIdStr,
            @Valid @RequestBody StudentInjuriesRequestBatch batchRequest
    ) {
        UUID userId = UUID.fromString(userIdStr);

        List<StudentInjuryResponse> result = studentInjuryService.batchUpdateInjuries(
                batchRequest.getCreated(),
                batchRequest.getUpdated(),
                batchRequest.getDeletedIds(),
                userId
        );

        return ResponseEntity.ok(result);
    }

    @GetMapping("/injuries")
    public ResponseEntity<List<StudentInjuryResponse>> getAll(
            @RequestHeader("X-User-Id") String userIdStr
    ) {
        UUID userId = UUID.fromString(userIdStr);

        return ResponseEntity.ok(studentInjuryService.getAllInjuries(userId));
    }
}