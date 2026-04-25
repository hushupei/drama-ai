package com.shortdrama.controller;

import com.shortdrama.dto.request.CreateChapterRequest;
import com.shortdrama.dto.response.ApiResponse;
import com.shortdrama.entity.Chapter;
import com.shortdrama.entity.Novel;
import com.shortdrama.service.ChapterService;
import com.shortdrama.service.NovelService;
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
@RequestMapping("/api/novels/{novelId}/chapters")
@RequiredArgsConstructor
public class ChapterController {

    private final ChapterService chapterService;
    private final NovelService novelService;

    @PostMapping
    public ResponseEntity<ApiResponse<Chapter>> create(
            @PathVariable UUID novelId,
            @Valid @RequestBody CreateChapterRequest request) {
        Novel novel = novelService.findById(novelId)
                .orElseThrow(() -> new RuntimeException("Novel not found"));

        Integer chapterNumber = request.getChapterNumber();
        if (chapterNumber == null) {
            chapterNumber = chapterService.findMaxChapterNumber(novelId) + 1;
        }

        Chapter chapter = Chapter.builder()
                .novel(novel)
                .title(request.getTitle())
                .chapterNumber(chapterNumber)
                .wordCount(request.getWordCount() != null ? request.getWordCount() : 0)
                .content(request.getContent())
                .build();

        Chapter created = chapterService.createChapter(chapter);
        return ResponseEntity.ok(ApiResponse.success("Chapter created", created));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Chapter>>> getByNovelId(@PathVariable UUID novelId) {
        List<Chapter> chapters = chapterService.findByNovelId(novelId);
        return ResponseEntity.ok(ApiResponse.success(chapters));
    }

    @GetMapping("/paged")
    public ResponseEntity<ApiResponse<Page<Chapter>>> getByNovelIdPaged(
            @PathVariable UUID novelId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("chapterNumber").ascending());
        Page<Chapter> chapters = chapterService.findByNovelId(novelId, pageable);
        return ResponseEntity.ok(ApiResponse.success(chapters));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Chapter>> getById(
            @PathVariable UUID novelId,
            @PathVariable UUID id) {
        Chapter chapter = chapterService.findById(id)
                .orElseThrow(() -> new RuntimeException("Chapter not found"));
        return ResponseEntity.ok(ApiResponse.success(chapter));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Chapter>> update(
            @PathVariable UUID novelId,
            @PathVariable UUID id,
            @Valid @RequestBody CreateChapterRequest request) {
        Chapter chapter = Chapter.builder()
                .title(request.getTitle())
                .chapterNumber(request.getChapterNumber())
                .wordCount(request.getWordCount())
                .content(request.getContent())
                .build();

        Chapter updated = chapterService.updateChapter(id, chapter);
        return ResponseEntity.ok(ApiResponse.success("Chapter updated", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID novelId,
            @PathVariable UUID id) {
        chapterService.deleteChapter(id);
        return ResponseEntity.ok(ApiResponse.success("Chapter deleted", null));
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> count(@PathVariable UUID novelId) {
        long count = chapterService.countByNovelId(novelId);
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @GetMapping("/word-count")
    public ResponseEntity<ApiResponse<Integer>> getTotalWordCount(@PathVariable UUID novelId) {
        Integer wordCount = chapterService.sumWordCountByNovelId(novelId);
        return ResponseEntity.ok(ApiResponse.success(wordCount != null ? wordCount : 0));
    }
}
