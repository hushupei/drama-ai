package com.shortdrama.controller;

import com.shortdrama.dto.request.CreateEpisodeRequest;
import com.shortdrama.dto.response.ApiResponse;
import com.shortdrama.entity.Chapter;
import com.shortdrama.entity.Episode;
import com.shortdrama.entity.Project;
import com.shortdrama.service.ChapterService;
import com.shortdrama.service.EpisodeService;
import com.shortdrama.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/episodes")
@RequiredArgsConstructor
public class EpisodeController {

    private final EpisodeService episodeService;
    private final ProjectService projectService;
    private final ChapterService chapterService;

    @PostMapping
    public ResponseEntity<ApiResponse<Episode>> create(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateEpisodeRequest request) {
        Project project = projectService.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        Chapter chapter = null;
        if (request.getChapterId() != null) {
            chapter = chapterService.findById(request.getChapterId())
                    .orElseThrow(() -> new RuntimeException("Chapter not found"));
        }

        Episode episode = Episode.builder()
                .project(project)
                .chapter(chapter)
                .episodeNumber(request.getEpisodeNumber())
                .title(request.getTitle())
                .description(request.getDescription())
                .scriptContent(request.getScriptContent())
                .duration(request.getDuration())
                .wordCount(request.getWordCount())
                .status(Episode.EpisodeStatus.PENDING)
                .build();

        Episode created = episodeService.createEpisode(episode);
        return ResponseEntity.ok(ApiResponse.success("Episode created", created));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Episode>>> getByProjectId(@PathVariable UUID projectId) {
        List<Episode> episodes = episodeService.findByProjectId(projectId);
        return ResponseEntity.ok(ApiResponse.success(episodes));
    }

    @GetMapping("/paged")
    public ResponseEntity<ApiResponse<Page<Episode>>> getByProjectIdPaged(
            @PathVariable UUID projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("episodeNumber").ascending());
        Page<Episode> episodes = episodeService.findByProjectId(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.success(episodes));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Episode>> getById(
            @PathVariable UUID projectId,
            @PathVariable UUID id) {
        Episode episode = episodeService.findById(id)
                .orElseThrow(() -> new RuntimeException("Episode not found"));
        return ResponseEntity.ok(ApiResponse.success(episode));
    }

    @GetMapping("/number/{number}")
    public ResponseEntity<ApiResponse<Episode>> getByNumber(
            @PathVariable UUID projectId,
            @PathVariable Integer number) {
        Episode episode = episodeService.findByProjectIdAndEpisodeNumber(projectId, number)
                .orElseThrow(() -> new RuntimeException("Episode not found"));
        return ResponseEntity.ok(ApiResponse.success(episode));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Episode>> update(
            @PathVariable UUID projectId,
            @PathVariable UUID id,
            @Valid @RequestBody CreateEpisodeRequest request) {
        Chapter chapter = null;
        if (request.getChapterId() != null) {
            chapter = chapterService.findById(request.getChapterId())
                    .orElseThrow(() -> new RuntimeException("Chapter not found"));
        }

        Episode episode = Episode.builder()
                .chapter(chapter)
                .episodeNumber(request.getEpisodeNumber())
                .title(request.getTitle())
                .description(request.getDescription())
                .scriptContent(request.getScriptContent())
                .duration(request.getDuration())
                .wordCount(request.getWordCount())
                .build();

        Episode updated = episodeService.updateEpisode(id, episode);
        return ResponseEntity.ok(ApiResponse.success("Episode updated", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID projectId,
            @PathVariable UUID id) {
        episodeService.deleteEpisode(id);
        return ResponseEntity.ok(ApiResponse.success("Episode deleted", null));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<Episode>>> getByStatus(
            @PathVariable UUID projectId,
            @PathVariable Episode.EpisodeStatus status) {
        List<Episode> episodes = episodeService.findByProjectIdAndStatus(projectId, status);
        return ResponseEntity.ok(ApiResponse.success(episodes));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Episode>> updateStatus(
            @PathVariable UUID projectId,
            @PathVariable UUID id,
            @RequestParam Episode.EpisodeStatus status) {
        Episode updated = episodeService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Status updated", updated));
    }

    @PatchMapping("/{id}/video")
    public ResponseEntity<ApiResponse<Episode>> updateVideoUrl(
            @PathVariable UUID projectId,
            @PathVariable UUID id,
            @RequestParam String videoUrl) {
        Episode updated = episodeService.updateVideoUrl(id, videoUrl);
        return ResponseEntity.ok(ApiResponse.success("Video URL updated", updated));
    }

    @PatchMapping("/{id}/audio")
    public ResponseEntity<ApiResponse<Episode>> updateAudioUrl(
            @PathVariable UUID projectId,
            @PathVariable UUID id,
            @RequestParam String audioUrl) {
        Episode updated = episodeService.updateAudioUrl(id, audioUrl);
        return ResponseEntity.ok(ApiResponse.success("Audio URL updated", updated));
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> count(@PathVariable UUID projectId) {
        long count = episodeService.countByProjectId(projectId);
        return ResponseEntity.ok(ApiResponse.success(count));
    }
}