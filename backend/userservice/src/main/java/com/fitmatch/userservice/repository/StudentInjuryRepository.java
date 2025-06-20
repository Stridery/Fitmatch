package com.fitmatch.userservice.repository;

import com.fitmatch.userservice.entity.StudentInjury;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StudentInjuryRepository extends JpaRepository<StudentInjury, UUID> {
    List<StudentInjury> findByUserId(UUID userId);
    Optional<StudentInjury> findByIdAndUserId(UUID id, UUID userId);
}
