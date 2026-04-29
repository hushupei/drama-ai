package com.shortdrama.service;

import com.shortdrama.entity.Project;
import com.shortdrama.entity.Novel;
import com.shortdrama.entity.User;
import com.shortdrama.exception.ResourceNotFoundException;
import com.shortdrama.repository.ProjectRepository;
import com.shortdrama.service.impl.ProjectServiceImpl;
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
@DisplayName("ProjectService Tests")
class ProjectServiceTest {

    @Mock private ProjectRepository projectRepository;
    @Mock private NovelService novelService;
    @InjectMocks private ProjectServiceImpl projectService;

    private Project testProject;
    private UUID testId;
    private UUID userId;
    private UUID novelId;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        userId = UUID.randomUUID();
        novelId = UUID.randomUUID();
        User user = User.builder().id(userId).username("testuser").build();
        Novel novel = Novel.builder().id(novelId).title("Test Novel").build();
        testProject = Project.builder()
                .id(testId)
                .user(user)
                .novel(novel)
                .name("Test Project")
                .description("Test Description")
                .type(Project.ProjectType.SINGLE_EPISODE)
                .status(Project.ProjectStatus.DRAFT)
                .build();
    }

    @Test
    @DisplayName("Should create project successfully")
    void createProject_shouldReturnSavedProject() {
        when(projectRepository.save(any(Project.class))).thenReturn(testProject);
        Project result = projectService.createProject(testProject);
        assertThat(result.getName()).isEqualTo("Test Project");
    }

    @Test
    @DisplayName("Should update project successfully")
    void updateProject_shouldReturnUpdatedProject() {
        Project updated = Project.builder()
                .name("Updated Project")
                .description("Updated Description")
                .type(Project.ProjectType.MULTI_EPISODE)
                .build();
        when(projectRepository.findById(testId)).thenReturn(Optional.of(testProject));
        when(projectRepository.save(any(Project.class))).thenReturn(testProject);
        Project result = projectService.updateProject(testId, updated);
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("Should find projects by user id")
    void findByUserId_shouldReturnProjects() {
        when(projectRepository.findByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(Arrays.asList(testProject));
        var result = projectService.findByUserId(userId);
        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("Should find projects by novel id")
    void findByNovelId_shouldReturnProjects() {
        when(projectRepository.findByNovelId(novelId))
                .thenReturn(Arrays.asList(testProject));
        var result = projectService.findByNovelId(novelId);
        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("Should update project status")
    void updateStatus_shouldReturnUpdatedProject() {
        when(projectRepository.findById(testId)).thenReturn(Optional.of(testProject));
        when(projectRepository.save(any(Project.class))).thenReturn(testProject);
        Project result = projectService.updateStatus(testId, Project.ProjectStatus.IN_PROGRESS);
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("Should count projects by novel id")
    void countByNovelId_shouldReturnCount() {
        when(projectRepository.countByNovelId(novelId)).thenReturn(3L);
        assertThat(projectService.countByNovelId(novelId)).isEqualTo(3L);
    }
}
