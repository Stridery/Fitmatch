package com.fitmatch.userservice.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.fitmatch.userservice.converter.JsonConverter;

@Entity
@Table(name = "user_profile")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "is_for", nullable = false)
    private String isFor;

    @Column(nullable = false)
    private String gender;

    @Column(nullable = false)
    private LocalDate birthday;

    @Column(nullable = false)
    private String country;

    @Column(nullable = false)
    private String city;

    private String mbtiType;

    @Min(0)
    @Max(250)
    @Column(name = "height_cm")
    private Integer heightCm;

    @Min(0)
    @Max(300)
    @Column(name = "weight_kg")
    private Integer weightKg;

    @Size(max = 30)
    @Column(name = "current_training_frequency")
    private String currentTrainingFrequency;

    @Column(name = "behavioral_answers", columnDefinition = "jsonb")
    @Convert(converter = JsonConverter.class)
    private Map<String, Object> behavioralAnswers;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private Timestamp createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private Timestamp updatedAt;

    // Getters and setters
}