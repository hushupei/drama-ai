package com.shortdrama.dto.response;

import com.shortdrama.entity.Episode;

import java.util.UUID;

public record DramaEpisodeResponse(
        UUID id,
        int episodeNumber,
        String title,
        int duration,
        String videoUrl
) {
    public static DramaEpisodeResponse from(Episode episode) {
        return new DramaEpisodeResponse(
                episode.getId(),
                episode.getEpisodeNumber() != null ? episode.getEpisodeNumber() : 0,
                episode.getTitle(),
                episode.getDuration() != null ? episode.getDuration() : 0,
                episode.getVideoUrl()
        );
    }
}
