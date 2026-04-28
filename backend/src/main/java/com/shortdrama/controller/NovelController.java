package com.shortdrama.controller;

import com.shortdrama.dto.request.CreateNovelRequest;
import com.shortdrama.dto.request.UpdateNovelRequest;
import com.shortdrama.dto.response.ApiResponse;
import com.shortdrama.entity.Novel;
import com.shortdrama.entity.User;
import com.shortdrama.service.NovelService;
import com.shortdrama.service.StorageService;
import com.shortdrama.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/novels")
@RequiredArgsConstructor
public class NovelController {

    private final NovelService novelService;
    private final UserService userService;
    private final StorageService storageService;

    @Value("${minio.bucket:novels}")
    private String bucketName;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Novel>> create(
            @RequestParam("title") String title,
            @RequestParam(value = "author", required = false) String author,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws IOException {
        UUID userId = (UUID) authentication.getCredentials();
        User user = userService.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate file
        validateFile(file);

        // Upload file to MinIO
        String sanitizedFileName = sanitizeFileName(file.getOriginalFilename());
        String objectName = UUID.randomUUID() + "-" + sanitizedFileName;
        storageService.uploadFile(bucketName, objectName, file.getInputStream(), file.getSize(), file.getContentType());

        Novel novel = Novel.builder()
                .title(title)
                .description(description)
                .author(author)
                .filePath(objectName)
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

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("文件不能为空");
        }

        // 文件大小限制：50MB
        long maxSize = 50 * 1024 * 1024;
        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException("文件大小不能超过50MB");
        }

        // 文件类型限制：只允许.txt
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".txt")) {
            throw new IllegalArgumentException("只允许上传.txt文本文件");
        }
    }

    private String sanitizeFileName(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return "unnamed.txt";
        }
        // 移除路径分隔符
        String sanitized = fileName.replaceAll("[\\\\/]", "_");
        // 限制长度
        if (sanitized.length() > 200) {
            sanitized = sanitized.substring(0, 200);
        }
        return sanitized;
    }
}
