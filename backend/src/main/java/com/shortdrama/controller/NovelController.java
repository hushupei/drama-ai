package com.shortdrama.controller;

import com.shortdrama.dto.request.CreateNovelRequest;
import com.shortdrama.dto.request.UpdateNovelRequest;
import com.shortdrama.dto.response.ApiResponse;
import com.shortdrama.entity.Novel;
import com.shortdrama.entity.User;
import com.shortdrama.service.NovelService;
import com.shortdrama.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/novels")
@RequiredArgsConstructor
public class NovelController {

    private final NovelService novelService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<ApiResponse<Novel>> create(
            @Valid @RequestBody CreateNovelRequest request,
            Authentication authentication) {
        UUID userId = (UUID) authentication.getCredentials();
        User user = userService.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Novel novel = Novel.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .author(request.getAuthor())
                .user(user)
                .status(Novel.NovelStatus.UPLOADED)
                .build();

        Novel created = novelService.createNovel(novel);
        return ResponseEntity.ok(ApiResponse.success("Novel created", created));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Novel>> getById(@PathVariable UUID id) {
        Novel novel = novelService.findById(id)
                .orElseThrow(() -> new RuntimeException("Novel not found"));
        return ResponseEntity.ok(ApiResponse.success(novel));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Novel>>> getMyNovels(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            Authentication authentication) {
        UUID userId = (UUID) authentication.getCredentials();
        String[] sortParams = sort.split(",");
        Sort sortObj = Sort.by(Sort.Direction.fromString(sortParams[1]), sortParams[0]);
        Pageable pageable = PageRequest.of(page, size, sortObj);

        Page<Novel> novels = novelService.findByUserId(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(novels));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Novel>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateNovelRequest request) {
        Novel novel = Novel.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .author(request.getAuthor())
                .build();

        Novel updated = novelService.updateNovel(id, novel);
        return ResponseEntity.ok(ApiResponse.success("Novel updated", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        novelService.deleteNovel(id);
        return ResponseEntity.ok(ApiResponse.success("Novel deleted", null));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Novel>> updateStatus(
            @PathVariable UUID id,
            @RequestParam Novel.NovelStatus status) {
        Novel updated = novelService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Status updated", updated));
    }
}
