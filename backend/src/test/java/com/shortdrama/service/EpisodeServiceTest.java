package com.shortdrama.service;

import com.shortdrama.entity.Episode;
import com.shortdrama.entity.Project;
import com.shortdrama.repository.EpisodeRepository;
import com.shortdrama.service.impl.EpisodeServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("EpisodeService Tests")
class EpisodeServiceTest {

    @Mock private EpisodeRepository episodeRepository;
    @Mock private ProjectService projectService;
    @InjectMocks private EpisodeServiceImpl episodeService;

    private Episode testEpisode;
    private UUID testId;
    private UUID projectId;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        Project project = Project.builder().id(projectId).name("Test Project").build();
        testEpisode = Episode.builder()
                .id(testId)
                .project(project)
                .episodeNumber(1)
                .title("Episode 1")
                .description("Test Episode")
                .status(Episode.EpisodeStatus.DRAFT)
                .build();
    }

    @Test
    @DisplayName("Should create episode successfully")
    void createEpisode_shouldReturnSavedEpisode() {
        when(episodeRepository.save(any(Episode.class))).thenReturn(testEpisode);
        Episode result = episodeService.createEpisode(testEpisode);
        assertThat(result.getTitle()).isEqualTo("Episode 1");
    }

    @Test
    @DisplayName("Should update episode successfully")
    void updateEpisode_shouldReturnUpdatedEpisode() {
        Episode updated = Episode.builder()
                .episodeNumber(2)
                .title("Updated Episode")
                .description("Updated Description")
                .build();
        when(episodeRepository.findById(testId)).thenReturn(Optional.of(testEpisode));
        when(episodeRepository.save(any(Episode.class))).thenReturn(testEpisode);
        Episode result = episodeService.updateEpisode(testId, updated);
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("Should find episodes by project id")
    void findByProjectId_shouldReturnEpisodes() {
        when(episodeRepository.findByProjectIdOrderByEpisodeNumberAsc(projectId))
                .thenReturn(Arrays.asList(testEpisode));
        var result = episodeService.findByProjectId(projectId);
        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("Should update episode status")
    void updateStatus_shouldReturnUpdatedEpisode() {
        when(episodeRepository.findById(testId)).thenReturn(Optional.of(testEpisode));
        when(episodeRepository.save(any(Episode.class))).thenReturn(testEpisode);
        Episode result = episodeService.updateStatus(testId, Episode.EpisodeStatus.COMPLETED);
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("Should update video URL")
    void updateVideoUrl_shouldReturnUpdatedEpisode() {
        when(episodeRepository.findById(testId)).thenReturn(Optional.of(testEpisode));
        when(episodeRepository.save(any(Episode.class))).thenReturn(testEpisode);
        Episode result = episodeService.updateVideoUrl(testId, "http://example.com/video.mp4");
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("Should count episodes by project id")
    void countByProjectId_shouldReturnCount() {
        when(episodeRepository.countByProjectId(projectId)).thenReturn(5L);
        assertThat(episodeService.countByProjectId(projectId)).isEqualTo(5L);
    }
}
