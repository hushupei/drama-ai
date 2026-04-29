package com.shortdrama.service.impl;

import com.shortdrama.entity.Episode;
import com.shortdrama.entity.Project;
import com.shortdrama.exception.BusinessException;
import com.shortdrama.exception.ResourceNotFoundException;
import com.shortdrama.repository.EpisodeRepository;
import com.shortdrama.repository.ProjectRepository;
import com.shortdrama.service.PublishService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PublishServiceImpl implements PublishService {

    private final ProjectRepository projectRepository;
    private final EpisodeRepository episodeRepository;

    @Override
    @Transactional
    public Project publish(UUID projectId, UUID userId, String coverUrl) {
        Project project = projectRepository.findByIdWithNovel(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId.toString()));

        // 所有权验证
        if (!project.getUser().getId().equals(userId)) {
            throw new BusinessException("无权操作此项目");
        }

        // 状态验证
        if (project.getStatus() != Project.ProjectStatus.COMPLETED) {
            throw new BusinessException("只有已完成的项目才能发布");
        }

        // 验证所有剧集
        List<Episode> episodes = episodeRepository.findByProjectIdOrderByEpisodeNumberAsc(projectId);
        if (episodes.isEmpty()) {
            throw new BusinessException("项目没有剧集，无法发布");
        }

        for (Episode episode : episodes) {
            if (episode.getStatus() != Episode.EpisodeStatus.COMPLETED) {
                throw new BusinessException("剧集 " + episode.getEpisodeNumber() + " 尚未完成");
            }
            if (episode.getVideoUrl() == null || episode.getVideoUrl().isBlank()) {
                throw new BusinessException("剧集 " + episode.getEpisodeNumber() + " 缺少视频地址");
            }
        }

        project.setStatus(Project.ProjectStatus.PUBLISHED);
        project.setPublishedAt(LocalDateTime.now());
        if (coverUrl != null && !coverUrl.isBlank()) {
            project.setCoverUrl(coverUrl);
        }

        return projectRepository.save(project);
    }
}
