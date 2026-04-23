package com.shortdrama.repository;

import com.shortdrama.entity.Episode;
import com.shortdrama.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EpisodeRepository extends JpaRepository<Episode, UUID> {

    List<Episode> findByProjectOrderByEpisodeNumberAsc(Project project);

    List<Episode> findByProjectIdOrderByEpisodeNumberAsc(UUID projectId);

    Optional<Episode> findByProjectAndEpisodeNumber(Project project, Integer episodeNumber);

    List<Episode> findByProjectAndStatus(Project project, Episode.EpisodeStatus status);

    List<Episode> findByChapterId(UUID chapterId);

    long countByProject(Project project);

    long countByProjectAndStatus(Project project, Episode.EpisodeStatus status);
}
