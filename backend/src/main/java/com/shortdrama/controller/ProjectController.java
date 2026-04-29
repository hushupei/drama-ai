package com.shortdrama.controller;

import com.shortdrama.dto.request.CreateProjectRequest;
import com.shortdrama.dto.request.PublishRequest;
import com.shortdrama.dto.response.ApiResponse;
import com.shortdrama.entity.Novel;
import com.shortdrama.entity.Project;
import com.shortdrama.entity.User;
import com.shortdrama.exception.BusinessException;
import com.shortdrama.service.NovelService;
import com.shortdrama.service.ProjectService;
import com.shortdrama.service.PublishService;
import com.shortdrama.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final UserService userService;
    private final NovelService novelService;
    private final PublishService publishService;

    @PostMapping
    public ResponseEntity<ApiResponse<Project>> create(
            @Valid @RequestBody CreateProjectRequest request,
            Authentication authentication) {
        UUID userId = resolveUserId(authentication);
        User user = userService.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Novel novel = novelService.findById(request.getNovelId())
                .orElseThrow(() -> new RuntimeException("Novel not found"));

        Project project = Project.builder()
                .user(user)
                .novel(novel)
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType())
                .targetEpisodeCount(request.getTargetEpisodeCount())
                .targetDuration(request.getTargetDuration())
                .status(Project.ProjectStatus.DRAFT)
                .build();

        Project created = projectService.createProject(project);
        return ResponseEntity.ok(ApiResponse.success("Project created", created));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Project>> getById(@PathVariable UUID id) {
        Project project = projectService.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        return ResponseEntity.ok(ApiResponse.success(project));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Project>>> getMyProjects(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            Authentication authentication) {
        UUID userId = resolveUserId(authentication);
        String[] sortParams = sort.split(",");
        Sort sortObj = Sort.by(Sort.Direction.fromString(sortParams[1]), sortParams[0]);
        Pageable pageable = PageRequest.of(page, size, sortObj);

        Page<Project> projects = projectService.findByUserId(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(projects));
    }

    @GetMapping("/novel/{novelId}")
    public ResponseEntity<ApiResponse<List<Project>>> getByNovelId(@PathVariable UUID novelId) {
        List<Project> projects = projectService.findByNovelId(novelId);
        return ResponseEntity.ok(ApiResponse.success(projects));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<Project>>> getByStatus(
            @PathVariable Project.ProjectStatus status,
            Authentication authentication) {
        UUID userId = resolveUserId(authentication);
        List<Project> projects = projectService.findByUserIdAndStatus(userId, status);
        return ResponseEntity.ok(ApiResponse.success(projects));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Project>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateProjectRequest request) {
        Project existing = projectService.findById(id)
                .orElseThrow(() -> new BusinessException("Project not found"));
        UUID currentUserId = getCurrentUserId();
        if (!existing.getUser().getId().equals(currentUserId)) {
            throw new BusinessException("无权操作此项目");
        }

        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType())
                .targetEpisodeCount(request.getTargetEpisodeCount())
                .targetDuration(request.getTargetDuration())
                .build();

        Project updated = projectService.updateProject(id, project);
        return ResponseEntity.ok(ApiResponse.success("Project updated", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        Project existing = projectService.findById(id)
                .orElseThrow(() -> new BusinessException("Project not found"));
        UUID currentUserId = getCurrentUserId();
        if (!existing.getUser().getId().equals(currentUserId)) {
            throw new BusinessException("无权操作此项目");
        }

        projectService.deleteProject(id);
        return ResponseEntity.ok(ApiResponse.success("Project deleted", null));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Project>> updateStatus(
            @PathVariable UUID id,
            @RequestParam Project.ProjectStatus status) {
        Project existing = projectService.findById(id)
                .orElseThrow(() -> new BusinessException("Project not found"));
        UUID currentUserId = getCurrentUserId();
        if (!existing.getUser().getId().equals(currentUserId)) {
            throw new BusinessException("无权操作此项目");
        }

        Project updated = projectService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Status updated", updated));
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<ApiResponse<Project>> publish(
            @PathVariable UUID id,
            @RequestBody(required = false) PublishRequest request) {
        UUID userId = getCurrentUserId();
        Project project = publishService.publish(id, userId,
                request != null ? request.coverUrl() : null);
        return ResponseEntity.ok(ApiResponse.success("发布成功", project));
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> count(Authentication authentication) {
        UUID userId = resolveUserId(authentication);
        long count = projectService.countByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    private UUID resolveUserId(Authentication authentication) {
        Object credentials = authentication.getCredentials();
        if (credentials instanceof UUID uuid) {
            return uuid;
        }
        String username = authentication.getName();
        return userService.findByUsername(username)
                .map(User::getId)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new BusinessException("未登录");
        }
        return resolveUserId(authentication);
    }
}