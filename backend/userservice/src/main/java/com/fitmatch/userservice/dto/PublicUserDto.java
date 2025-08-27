package com.fitmatch.userservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicUserDto {
    private String id;          // userId as string
    private String nickname;
    private String avatarUrl;
}

