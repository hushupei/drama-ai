package com.shortdrama.service.impl;

import com.shortdrama.dto.response.DramaResponse;
import com.shortdrama.entity.Project;
import com.shortdrama.exception.BusinessException;
import com.shortdrama.exception.ResourceNotFoundException;
import com.shortdrama.repository.ProjectRepository;
import com.shortdrama.service.DramaService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DramaServiceImpl implements DramaService {

    private final ProjectRepository projectRepository;

    @Override
    public Page<DramaResponse> findPublished(Pageable pageable, String keyword) {
        Page<Project> projects;
        if (keyword != null && !keyword.isBlank()) {
            projects = projectRepository.findByStatusAndNameKeyword(
                    Project.ProjectStatus.PUBLISHED, keyword, pageable);
        } else {
            projects = projectRepository.findByStatus(Project.ProjectStatus.PUBLISHED, pageable);
        }
        return projects.map(DramaResponse::from);
    }

    @Override
    public DramaResponse findById(UUID id) {
        Project project = projectRepository.findByIdWithNovel(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", id.toString()));

        if (project.getStatus() != Project.ProjectStatus.PUBLISHED) {
            throw new BusinessException("该短剧尚未发布");
        }

        return DramaResponse.from(project);
    }
}
