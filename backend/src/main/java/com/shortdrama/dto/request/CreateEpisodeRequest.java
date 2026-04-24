package com.shortdrama.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class CreateEpisodeRequest {

    @NotNull(message = "Project ID is required")
    private UUID projectId;

    @NotNull(message = "Episode number is required")
    private Integer episodeNumber;

    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    private UUID chapterId;

    private String scriptContent;

    private Integer duration;

    private Integer wordCount;
}
