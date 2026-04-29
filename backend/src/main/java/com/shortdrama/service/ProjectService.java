package com.shortdrama.service;

import com.shortdrama.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectService {
    Project createProject(Project project);
    Project updateProject(UUID id, Project project);
    void deleteProject(UUID id);
    Optional<Project> findById(UUID id);
    List<Project> findByUserId(UUID userId);
    Page<Project> findByUserId(UUID userId, Pageable pageable);
    List<Project> findByNovelId(UUID novelId);
    List<Project> findByUserIdAndStatus(UUID userId, Project.ProjectStatus status);
    Project updateStatus(UUID id, Project.ProjectStatus status);
    void recalculateStatus(UUID projectId);
    long countByUserId(UUID userId);
    long countByNovelId(UUID novelId);
}
