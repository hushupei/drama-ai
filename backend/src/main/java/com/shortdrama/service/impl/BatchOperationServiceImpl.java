package com.shortdrama.service.impl;

import com.shortdrama.dto.response.BatchOperationResponse;
import com.shortdrama.dto.response.BatchResult;
import com.shortdrama.entity.Chapter;
import com.shortdrama.entity.Episode;
import com.shortdrama.entity.Novel;
import com.shortdrama.exception.ResourceNotFoundException;
import com.shortdrama.repository.EpisodeRepository;
import com.shortdrama.repository.ProjectRepository;
import com.shortdrama.service.BatchOperationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Service
@Transactional(readOnly = true)
public class BatchOperationServiceImpl implements BatchOperationService {

    private final EpisodeRepository episodeRepository;
    private final ProjectRepository projectRepository;
    private final RestTemplate restTemplate;

    @Value("${ai-service.base-url:http://ai-service:8000}")
    private String aiServiceBaseUrl;

    public BatchOperationServiceImpl(EpisodeRepository episodeRepository,
                                      ProjectRepository projectRepository,
                                      RestTemplate restTemplate) {
        this.episodeRepository = episodeRepository;
        this.projectRepository = projectRepository;
        this.restTemplate = restTemplate;
    }

    @Override
    @Transactional
    public BatchOperationResponse generateAll(UUID projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", projectId.toString());
        }

        List<Episode> allEpisodes = episodeRepository.findByProjectIdOrderByEpisodeNumberAsc(projectId);
        List<Episode> targetEpisodes = allEpisodes.stream()
                .filter(e -> e.getStatus() == Episode.EpisodeStatus.DRAFT
                        || e.getStatus() == Episode.EpisodeStatus.FAILED)
                .toList();

        List<BatchResult> results = new ArrayList<>();
        int succeeded = 0;
        int failed = 0;

        for (Episode episode : targetEpisodes) {
            try {
                Chapter chapter = episode.getChapter();
                if (chapter == null) {
                    throw new IllegalStateException("剧集未关联章节");
                }
                Novel novel = chapter.getNovel();
                if (novel == null) {
                    throw new IllegalStateException("章节未关联小说");
                }

                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("chapter_id", chapter.getId().toString());
                requestBody.put("episode_id", episode.getId().toString());
                requestBody.put("project_id", projectId.toString());
                requestBody.put("novel_id", novel.getId().toString());
                requestBody.put("style", "mixed");
                requestBody.put("character_count", 2);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

                ResponseEntity<Map> response = restTemplate.postForEntity(
                        aiServiceBaseUrl + "/api/v1/tasks/generate",
                        request,
                        Map.class
                );

                String taskId = null;
                if (response.getBody() != null && response.getBody().get("task_id") != null) {
                    taskId = response.getBody().get("task_id").toString();
                }

                episode.setStatus(Episode.EpisodeStatus.SCRIPT_GENERATING);
                episode.setErrorMessage(null);
                episode.setFailedStep(null);
                episodeRepository.save(episode);

                results.add(BatchResult.success(episode.getId(),
                        episode.getEpisodeNumber() != null ? episode.getEpisodeNumber() : 0, taskId));
                succeeded++;
                log.info("Script generation dispatched: episode={}, taskId={}", episode.getId(), taskId);

            } catch (Exception e) {
                log.error("Failed to dispatch script generation for episode {}: {}",
                        episode.getId(), e.getMessage());
                episode.setStatus(Episode.EpisodeStatus.FAILED);
                episode.setFailedStep("script_generation");
                episode.setErrorMessage("AI服务调用失败: " + e.getMessage());
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
                if (episode.getScriptContent() == null || episode.getScriptContent().isBlank()) {
                    throw new IllegalStateException("剧集缺少剧本内容");
                }

                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("script_id", episode.getId().toString());
                requestBody.put("episode_id", episode.getId().toString());
                requestBody.put("project_id", projectId.toString());
                requestBody.put("resolution", "1080p");
                requestBody.put("duration_target", 60);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

                ResponseEntity<Map> response = restTemplate.postForEntity(
                        aiServiceBaseUrl + "/api/v1/tasks/render",
                        request,
                        Map.class
                );

                String taskId = null;
                if (response.getBody() != null && response.getBody().get("task_id") != null) {
                    taskId = response.getBody().get("task_id").toString();
                }

                episode.setStatus(Episode.EpisodeStatus.VIDEO_GENERATING);
                episode.setErrorMessage(null);
                episode.setFailedStep(null);
                episodeRepository.save(episode);

                results.add(BatchResult.success(episode.getId(),
                        episode.getEpisodeNumber() != null ? episode.getEpisodeNumber() : 0, taskId));
                succeeded++;
                log.info("Video rendering dispatched: episode={}, taskId={}", episode.getId(), taskId);

            } catch (Exception e) {
                log.error("Failed to dispatch video rendering for episode {}: {}",
                        episode.getId(), e.getMessage());
                episode.setStatus(Episode.EpisodeStatus.FAILED);
                episode.setFailedStep("video_rendering");
                episode.setErrorMessage("AI服务调用失败: " + e.getMessage());
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
