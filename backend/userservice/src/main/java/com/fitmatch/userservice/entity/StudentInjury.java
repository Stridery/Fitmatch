package com.fitmatch.userservice.entity;

import com.fitmatch.userservice.converter.JsonListConverter;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.sql.Timestamp;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "student_injuries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentInjury {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "injury_type", nullable = false)
    private String injuryType;

    @Column(name = "custom_injury_type")
    private String customInjuryType;

    @Column(name = "injury_tag", columnDefinition = "jsonb")
    @Convert(converter = JsonListConverter.class)
    private List<String> injuryTag;

    @Builder.Default
    @Column(name = "is_visible_to_coach", nullable = false)
    private Boolean isVisibleToCoach = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Timestamp createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Timestamp updatedAt;

}