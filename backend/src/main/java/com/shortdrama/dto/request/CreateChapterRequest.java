package com.shortdrama.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class CreateChapterRequest {

    @NotNull(message = "Novel ID is required")
    private UUID novelId;

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    private Integer chapterNumber;

    private Integer wordCount;

    private String content;
}
