package com.shortdrama.service.impl;

import com.shortdrama.entity.Chapter;
import com.shortdrama.entity.Episode;
import com.shortdrama.entity.Project;
import com.shortdrama.exception.ResourceNotFoundException;
import com.shortdrama.repository.EpisodeRepository;
import com.shortdrama.service.ChapterService;
import com.shortdrama.service.EpisodeService;
import com.shortdrama.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EpisodeServiceImpl implements EpisodeService {

    private final EpisodeRepository episodeRepository;
    private final ProjectService projectService;
    private final ChapterService chapterService;

    @Override
    @Transactional
    public Episode createEpisode(Episode episode) {
        return episodeRepository.save(episode);
    }

    @Override
    @Transactional
    public Episode updateEpisode(UUID id, Episode episode) {
        Episode existingEpisode = episodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Episode", id.toString()));
        existingEpisode.setEpisodeNumber(episode.getEpisodeNumber());
        existingEpisode.setTitle(episode.getTitle());
        existingEpisode.setDescription(episode.getDescription());
        existingEpisode.setScriptContent(episode.getScriptContent());
        existingEpisode.setDuration(episode.getDuration());
        existingEpisode.setWordCount(episode.getWordCount());
        existingEpisode.setChapter(episode.getChapter());
        return episodeRepository.save(existingEpisode);
    }

    @Override
    @Transactional
    public void deleteEpisode(UUID id) {
        if (!episodeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Episode", id.toString());
        }
        episodeRepository.deleteById(id);
    }

    @Override
    public Optional<Episode> findById(UUID id) {
        return episodeRepository.findById(id);
    }

    @Override
    public List<Episode> findByProjectId(UUID projectId) {
        return episodeRepository.findByProjectIdOrderByEpisodeNumberAsc(projectId);
    }

    @Override
    public Page<Episode> findByProjectId(UUID projectId, Pageable pageable) {
        return episodeRepository.findByProjectId(projectId, pageable);
    }

    @Override
    public Optional<Episode> findByProjectIdAndEpisodeNumber(UUID projectId, Integer episodeNumber) {
        return episodeRepository.findByProjectIdAndEpisodeNumber(projectId, episodeNumber);
    }

    @Override
    public List<Episode> findByProjectIdAndStatus(UUID projectId, Episode.EpisodeStatus status) {
        return episodeRepository.findByProjectIdAndStatus(projectId, status);
    }

    @Override
    public List<Episode> findByChapterId(UUID chapterId) {
        return episodeRepository.findByChapterId(chapterId);
    }

    @Override
    @Transactional
    public Episode updateStatus(UUID id, Episode.EpisodeStatus status) {
        Episode episode = episodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Episode", id.toString()));
        episode.setStatus(status);
        if (status == Episode.EpisodeStatus.COMPLETED) {
            episode.setCompletedAt(LocalDateTime.now());
        }
        episode = episodeRepository.save(episode);
        projectService.recalculateStatus(episode.getProject().getId());
        return episode;
    }

    @Override
    @Transactional
    public Episode updateVideoUrl(UUID id, String videoUrl) {
        Episode episode = episodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Episode", id.toString()));
        episode.setVideoUrl(videoUrl);
        return episodeRepository.save(episode);
    }

    @Override
    @Transactional
    public Episode updateAudioUrl(UUID id, String audioUrl) {
        Episode episode = episodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Episode", id.toString()));
        episode.setAudioUrl(audioUrl);
        return episodeRepository.save(episode);
    }

    @Override
    public long countByProjectId(UUID projectId) {
        return episodeRepository.countByProjectId(projectId);
    }

    @Override
    public long countByProjectIdAndStatus(UUID projectId, Episode.EpisodeStatus status) {
        return episodeRepository.countByProjectIdAndStatus(projectId, status);
    }

    @Override
    @Transactional
    public List<Episode> initFromChapters(UUID projectId, List<UUID> chapterIds) {
        Project project = projectService.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId.toString()));

        int existingMaxNumber = episodeRepository.findByProjectIdOrderByEpisodeNumberAsc(projectId)
                .stream().mapToInt(e -> e.getEpisodeNumber() != null ? e.getEpisodeNumber() : 0)
                .max().orElse(0);

        List<Episode> created = new ArrayList<>();
        int nextNumber = existingMaxNumber + 1;

        for (UUID chapterId : chapterIds) {
            List<Episode> existing = episodeRepository.findByChapterId(chapterId);
            if (!existing.isEmpty()) continue;

            Chapter chapter = chapterService.findById(chapterId)
                    .orElseThrow(() -> new ResourceNotFoundException("Chapter", chapterId.toString()));

            Episode episode = Episode.builder()
                    .project(project)
                    .chapter(chapter)
                    .episodeNumber(nextNumber++)
                    .title(chapter.getTitle())
                    .status(Episode.EpisodeStatus.DRAFT)
                    .build();
            created.add(episodeRepository.save(episode));
        }

        return created;
    }
}
