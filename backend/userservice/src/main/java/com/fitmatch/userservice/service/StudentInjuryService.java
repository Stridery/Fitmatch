package com.fitmatch.userservice.service;

import com.fitmatch.userservice.dto.StudentInjuryCreateRequest;
import com.fitmatch.userservice.dto.StudentInjuryUpdateRequest;
import com.fitmatch.userservice.dto.StudentInjuryResponse;
import com.fitmatch.userservice.entity.StudentInjury;
import com.fitmatch.userservice.repository.StudentInjuryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentInjuryService {

    private final StudentInjuryRepository studentInjuryRepository;

    public StudentInjuryResponse createInjury(StudentInjuryCreateRequest request, UUID userId) {
        StudentInjury injury = StudentInjury.builder()
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

    public StudentInjuryResponse updateInjury(UUID injuryId, StudentInjuryUpdateRequest request, UUID userId) {
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

    @Transactional
    public List<StudentInjuryResponse> batchUpdateInjuries(
            List<StudentInjuryCreateRequest> created,
            List<StudentInjuryUpdateRequest> updated,
            List<UUID> deletedIds,
            UUID userId
    ) {
        Timestamp now = Timestamp.from(Instant.now());

        // ⭐ 批量新增
        List<StudentInjury> toCreate = created != null
                ? created.stream()
                    .map(req -> StudentInjury.builder()
                            .injuryType(req.getInjuryType())
                            .customInjuryType(req.getCustomInjuryType())
                            .injuryTag(req.getInjuryTag())
                            .isVisibleToCoach(req.getIsVisibleToCoach() != null ? req.getIsVisibleToCoach() : true)
                            .userId(userId)
                            .createdAt(now)
                            .updatedAt(now)
                            .build())
                    .toList()
                : List.of();

        List<StudentInjury> createdEntities = !toCreate.isEmpty()
                ? studentInjuryRepository.saveAll(toCreate)
                : List.of();

        List<StudentInjuryResponse> createdResponses = createdEntities.stream()
                .map(this::toResponse)
                .toList();

        // 🔄 更新仍然是逐条
        List<StudentInjuryResponse> updatedResponses = updated != null
                ? updated.stream()
                    .map(req -> updateInjury(req.getId(), req, userId))
                    .toList()
                : List.of();

        // 🗑️ 批量删除
        if (deletedIds != null && !deletedIds.isEmpty()) {
            studentInjuryRepository.deleteAllByIdInAndUserId(deletedIds, userId);
        }

        // 合并结果
        List<StudentInjuryResponse> allResponses = new java.util.ArrayList<>();
        allResponses.addAll(createdResponses);
        allResponses.addAll(updatedResponses);

        return allResponses;
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
