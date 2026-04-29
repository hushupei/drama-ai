package com.shortdrama.service.impl;

import com.shortdrama.dto.response.BatchOperationResponse;
import com.shortdrama.dto.response.BatchResult;
import com.shortdrama.entity.Episode;
import com.shortdrama.exception.ResourceNotFoundException;
import com.shortdrama.repository.EpisodeRepository;
import com.shortdrama.repository.ProjectRepository;
import com.shortdrama.service.BatchOperationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BatchOperationServiceImpl implements BatchOperationService {

    private final EpisodeRepository episodeRepository;
    private final ProjectRepository projectRepository;

    @Override
    @Transactional
    public BatchOperationResponse generateAll(UUID projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", projectId.toString());
        }

        List<Episode> allEpisodes = episodeRepository.findByProjectIdOrderByEpisodeNumberAsc(projectId);
        List<Episode> targetEpisodes = allEpisodes.stream()
                .filter(e -> e.getStatus() == Episode.EpisodeStatus.DRAFT
                        || e.getStatus() == Episode.EpisodeStatus.SCRIPT_GENERATING)
                .toList();

        List<BatchResult> results = new ArrayList<>();
        int succeeded = 0;
        int failed = 0;

        for (Episode episode : targetEpisodes) {
            try {
                String taskId = "script-gen-" + episode.getId().toString().substring(0, 8);
                episode.setStatus(Episode.EpisodeStatus.SCRIPT_GENERATING);
                episodeRepository.save(episode);
                results.add(BatchResult.success(episode.getId(),
                        episode.getEpisodeNumber() != null ? episode.getEpisodeNumber() : 0, taskId));
                succeeded++;
            } catch (Exception e) {
                episode.setStatus(Episode.EpisodeStatus.FAILED);
                episode.setErrorMessage(e.getMessage());
                episodeRepository.save(episode);
                results.add(BatchResult.failure(episode.getId(),
                        episode.getEpisodeNumber() != null ? episode.getEpisodeNumber() : 0, e.getMessage()));
                failed++;
            }
        }

        return new BatchOperationResponse(targetEpisodes.size(), succeeded, failed, results);
    }

    @Override
    @Transactional
    public BatchOperationResponse renderAll(UUID projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", projectId.toString());
        }

        List<Episode> allEpisodes = episodeRepository.findByProjectIdOrderByEpisodeNumberAsc(projectId);
        List<Episode> targetEpisodes = allEpisodes.stream()
                .filter(e -> e.getStatus() == Episode.EpisodeStatus.SCRIPT_READY)
                .toList();

        List<BatchResult> results = new ArrayList<>();
        int succeeded = 0;
        int failed = 0;

        for (Episode episode : targetEpisodes) {
            try {
                String taskId = "video-gen-" + episode.getId().toString().substring(0, 8);
                episode.setStatus(Episode.EpisodeStatus.VIDEO_GENERATING);
                episodeRepository.save(episode);
                results.add(BatchResult.success(episode.getId(),
                        episode.getEpisodeNumber() != null ? episode.getEpisodeNumber() : 0, taskId));
                succeeded++;
            } catch (Exception e) {
                episode.setStatus(Episode.EpisodeStatus.FAILED);
                episode.setErrorMessage(e.getMessage());
                episodeRepository.save(episode);
                results.add(BatchResult.failure(episode.getId(),
                        episode.getEpisodeNumber() != null ? episode.getEpisodeNumber() : 0, e.getMessage()));
                failed++;
            }
        }

        return new BatchOperationResponse(targetEpisodes.size(), succeeded, failed, results);
    }

    @Override
    @Transactional
    public BatchOperationResponse cancelGenerateAll(UUID projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", projectId.toString());
        }

        List<Episode> allEpisodes = episodeRepository.findByProjectIdOrderByEpisodeNumberAsc(projectId);
        List<Episode> targetEpisodes = allEpisodes.stream()
                .filter(e -> e.getStatus() == Episode.EpisodeStatus.SCRIPT_GENERATING)
                .toList();

        List<BatchResult> results = new ArrayList<>();
        int succeeded = 0;

        for (Episode episode : targetEpisodes) {
            episode.setStatus(Episode.EpisodeStatus.DRAFT);
            episodeRepository.save(episode);
            results.add(BatchResult.success(episode.getId(),
                    episode.getEpisodeNumber() != null ? episode.getEpisodeNumber() : 0, null));
            succeeded++;
        }

        return new BatchOperationResponse(targetEpisodes.size(), succeeded, 0, results);
    }

    @Override
    @Transactional
    public BatchOperationResponse cancelRenderAll(UUID projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", projectId.toString());
        }

        List<Episode> allEpisodes = episodeRepository.findByProjectIdOrderByEpisodeNumberAsc(projectId);
        List<Episode> targetEpisodes = allEpisodes.stream()
                .filter(e -> e.getStatus() == Episode.EpisodeStatus.VIDEO_GENERATING)
                .toList();

        List<BatchResult> results = new ArrayList<>();
        int succeeded = 0;

        for (Episode episode : targetEpisodes) {
            episode.setStatus(Episode.EpisodeStatus.SCRIPT_READY);
            episodeRepository.save(episode);
            results.add(BatchResult.success(episode.getId(),
                    episode.getEpisodeNumber() != null ? episode.getEpisodeNumber() : 0, null));
            succeeded++;
        }

        return new BatchOperationResponse(targetEpisodes.size(), succeeded, 0, results);
    }
}
