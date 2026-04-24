package com.shortdrama.service;

import com.shortdrama.entity.Episode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EpisodeService {
    Episode createEpisode(Episode episode);
    Episode updateEpisode(UUID id, Episode episode);
    void deleteEpisode(UUID id);
    Optional<Episode> findById(UUID id);
    List<Episode> findByProjectId(UUID projectId);
    Page<Episode> findByProjectId(UUID projectId, Pageable pageable);
    Optional<Episode> findByProjectIdAndEpisodeNumber(UUID projectId, Integer episodeNumber);
    List<Episode> findByProjectIdAndStatus(UUID projectId, Episode.EpisodeStatus status);
    List<Episode> findByChapterId(UUID chapterId);
    Episode updateStatus(UUID id, Episode.EpisodeStatus status);
    Episode updateVideoUrl(UUID id, String videoUrl);
    Episode updateAudioUrl(UUID id, String audioUrl);
    long countByProjectId(UUID projectId);
    long countByProjectIdAndStatus(UUID projectId, Episode.EpisodeStatus status);
}
