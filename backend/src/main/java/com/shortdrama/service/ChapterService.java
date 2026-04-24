package com.shortdrama.service;

import com.shortdrama.entity.Chapter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChapterService {
    Chapter createChapter(Chapter chapter);
    Chapter updateChapter(UUID id, Chapter chapter);
    void deleteChapter(UUID id);
    Optional<Chapter> findById(UUID id);
    List<Chapter> findByNovelId(UUID novelId);
    Page<Chapter> findByNovelId(UUID novelId, Pageable pageable);
    Integer findMaxChapterNumber(UUID novelId);
    Integer sumWordCountByNovelId(UUID novelId);
    long countByNovelId(UUID novelId);
}
