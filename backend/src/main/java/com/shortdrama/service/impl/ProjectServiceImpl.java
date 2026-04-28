package com.shortdrama.service.impl;

import com.shortdrama.entity.Episode;
import com.shortdrama.entity.Project;
import com.shortdrama.exception.ResourceNotFoundException;
import com.shortdrama.repository.EpisodeRepository;
import com.shortdrama.repository.ProjectRepository;
import com.shortdrama.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final EpisodeRepository episodeRepository;

    @Override
    @Transactional
    public Project createProject(Project project) {
        return projectRepository.save(project);
    }

    @Override
    @Transactional
    public Project updateProject(UUID id, Project project) {
        Project existingProject = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", id.toString()));
        existingProject.setName(project.getName());
        existingProject.setDescription(project.getDescription());
        existingProject.setType(project.getType());
        existingProject.setTargetEpisodeCount(project.getTargetEpisodeCount());
        existingProject.setTargetDuration(project.getTargetDuration());
        return projectRepository.save(existingProject);
    }

    @Override
    @Transactional
    public void deleteProject(UUID id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", id.toString()));
        // 先删除关联的episodes避免外键约束错误
        List<Episode> episodes = episodeRepository.findByProjectIdOrderByEpisodeNumberAsc(id);
        if (!episodes.isEmpty()) {
            episodeRepository.deleteAll(episodes);
        }
        projectRepository.delete(project);
    }

    @Override
    public Optional<Project> findById(UUID id) {
        return projectRepository.findById(id);
    }

    @Override
    public List<Project> findByUserId(UUID userId) {
        return projectRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public Page<Project> findByUserId(UUID userId, Pageable pageable) {
        return projectRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    @Override
    public List<Project> findByNovelId(UUID novelId) {
        return projectRepository.findByNovelId(novelId);
    }

    @Override
    public List<Project> findByUserIdAndStatus(UUID userId, Project.ProjectStatus status) {
        return projectRepository.findByUserIdAndStatus(userId, status);
    }

    @Override
    @Transactional
    public Project updateStatus(UUID id, Project.ProjectStatus status) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", id.toString()));
        project.setStatus(status);
        return projectRepository.save(project);
    }

    @Override
    public long countByUserId(UUID userId) {
        return projectRepository.countByUserId(userId);
    }

    @Override
    public long countByNovelId(UUID novelId) {
        return projectRepository.countByNovelId(novelId);
    }
}
