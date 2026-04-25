package com.shortdrama.dto.request;

import com.shortdrama.entity.Project;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class CreateProjectRequest {

    @NotNull(message = "Novel ID is required")
    private UUID novelId;

    @NotBlank(message = "Name is required")
    @Size(max = 255, message = "Name must not exceed 255 characters")
    private String name;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    private Project.ProjectType type;

    private Integer targetEpisodeCount;

    private Integer targetDuration;
}
