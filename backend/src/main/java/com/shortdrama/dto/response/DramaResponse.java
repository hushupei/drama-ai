package com.shortdrama.dto.response;

import com.shortdrama.entity.Episode;
import com.shortdrama.entity.Project;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

public record DramaResponse(
        UUID id,
        String name,
        String author,
        String description,
        String coverUrl,
        int episodeCount,
        int totalDuration,
        LocalDateTime publishedAt,
        List<DramaEpisodeResponse> episodes
) {
    public static DramaResponse from(Project project) {
        List<Episode> projectEpisodes = project.getEpisodes();
        List<DramaEpisodeResponse> episodeResponses;
        int episodeCount;
        int totalDuration;

        if (projectEpisodes != null) {
            episodeCount = projectEpisodes.size();
            totalDuration = projectEpisodes.stream()
                    .mapToInt(e -> e.getDuration() != null ? e.getDuration() : 0)
                    .sum();
            episodeResponses = projectEpisodes.stream()
                    .map(DramaEpisodeResponse::from)
                    .toList();
        } else {
            episodeCount = 0;
            totalDuration = 0;
            episodeResponses = Collections.emptyList();
        }

        String author = project.getNovel() != null ? project.getNovel().getAuthor() : null;

        return new DramaResponse(
                project.getId(),
                project.getName(),
                author,
                project.getDescription(),
                project.getCoverUrl(),
                episodeCount,
                totalDuration,
                project.getPublishedAt(),
                episodeResponses
        );
    }
}
