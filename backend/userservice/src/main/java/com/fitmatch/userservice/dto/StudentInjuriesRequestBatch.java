package com.fitmatch.userservice.dto;

import lombok.Data;

import java.util.List;
import java.util.UUID;


@Data
public class StudentInjuriesRequestBatch {
    private List<StudentInjuryCreateRequest> created;

    private List<StudentInjuryUpdateRequest> updated;

    private List<UUID> deletedIds;
}