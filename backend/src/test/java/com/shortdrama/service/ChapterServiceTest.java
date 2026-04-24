package com.shortdrama.service;

import com.shortdrama.entity.Chapter;
import com.shortdrama.entity.Novel;
import com.shortdrama.exception.ResourceNotFoundException;
import com.shortdrama.repository.ChapterRepository;
import com.shortdrama.service.impl.ChapterServiceImpl;
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
@DisplayName("ChapterService Tests")
class ChapterServiceTest {

    @Mock private ChapterRepository chapterRepository;
    @InjectMocks private ChapterServiceImpl chapterService;

    private Chapter testChapter;
    private UUID testId;
    private UUID novelId;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        novelId = UUID.randomUUID();
        Novel novel = Novel.builder().id(novelId).title("Test Novel").build();
        testChapter = Chapter.builder()
                .id(testId)
                .novel(novel)
                .title("Chapter 1")
                .chapterNumber(1)
                .wordCount(1000)
                .content("Test content")
                .build();
    }

    @Test
    @DisplayName("Should create chapter successfully")
    void createChapter_shouldReturnSavedChapter() {
        when(chapterRepository.save(any(Chapter.class))).thenReturn(testChapter);
        Chapter result = chapterService.createChapter(testChapter);
        assertThat(result.getTitle()).isEqualTo("Chapter 1");
    }

    @Test
    @DisplayName("Should update chapter successfully")
    void updateChapter_shouldReturnUpdatedChapter() {
        Chapter updated = Chapter.builder().title("Updated Title").content("Updated content").wordCount(2000).build();
        when(chapterRepository.findById(testId)).thenReturn(Optional.of(testChapter));
        when(chapterRepository.save(any(Chapter.class))).thenReturn(testChapter);
        Chapter result = chapterService.updateChapter(testId, updated);
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("Should throw exception when updating non-existent chapter")
    void updateChapter_shouldThrowException() {
        UUID nonExistent = UUID.randomUUID();
        when(chapterRepository.findById(nonExistent)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> chapterService.updateChapter(nonExistent, testChapter))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Should find chapters by novel id")
    void findByNovelId_shouldReturnChapters() {
        when(chapterRepository.findByNovelIdOrderByChapterNumberAsc(novelId))
                .thenReturn(Arrays.asList(testChapter));
        var result = chapterService.findByNovelId(novelId);
        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("Should count chapters by novel id")
    void countByNovelId_shouldReturnCount() {
        when(chapterRepository.countByNovelId(novelId)).thenReturn(10L);
        assertThat(chapterService.countByNovelId(novelId)).isEqualTo(10L);
    }
}
