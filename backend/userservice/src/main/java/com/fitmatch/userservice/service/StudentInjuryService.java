package com.fitmatch.userservice.service;

import com.fitmatch.userservice.dto.StudentInjuryRequest;
import com.fitmatch.userservice.dto.StudentInjuryResponse;
import com.fitmatch.userservice.entity.StudentInjury;
import com.fitmatch.userservice.repository.StudentInjuryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentInjuryService {

    private final StudentInjuryRepository studentInjuryRepository;

    public StudentInjuryResponse createInjury(StudentInjuryRequest request, UUID userId) {
        StudentInjury injury = StudentInjury.builder()
                .userId(userId)
                .injuryType(request.getInjuryType())
                .customInjuryType(request.getCustomInjuryType())
                .injuryTag(request.getInjuryTag())
                .isVisibleToCoach(request.getIsVisibleToCoach() != null ? request.getIsVisibleToCoach() : true)
                .createdAt(Timestamp.from(Instant.now()))
                .updatedAt(Timestamp.from(Instant.now()))
                .build();

        StudentInjury saved = studentInjuryRepository.save(injury);
        return toResponse(saved);
    }

    public StudentInjuryResponse updateInjury(UUID injuryId, StudentInjuryRequest request, UUID userId) {
        StudentInjury injury = studentInjuryRepository.findByIdAndUserId(injuryId, userId)
                .orElseThrow(() -> new RuntimeException("Injury not found or unauthorized"));

        injury.setInjuryType(request.getInjuryType());
        injury.setCustomInjuryType(request.getCustomInjuryType());
        injury.setInjuryTag(request.getInjuryTag());
        injury.setIsVisibleToCoach(request.getIsVisibleToCoach());
        injury.setUpdatedAt(Timestamp.from(Instant.now()));

        return toResponse(studentInjuryRepository.save(injury));
    }

    public void deleteInjury(UUID injuryId, UUID userId) {
        StudentInjury injury = studentInjuryRepository.findByIdAndUserId(injuryId, userId)
                .orElseThrow(() -> new RuntimeException("Injury not found or unauthorized"));
        studentInjuryRepository.delete(injury);
    }

    public List<StudentInjuryResponse> getAllInjuries(UUID userId) {
        return studentInjuryRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private StudentInjuryResponse toResponse(StudentInjury entity) {
        return StudentInjuryResponse.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .injuryType(entity.getInjuryType())
                .customInjuryType(entity.getCustomInjuryType())
                .injuryTag(entity.getInjuryTag())
                .isVisibleToCoach(entity.getIsVisibleToCoach())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
