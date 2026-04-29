package com.shortdrama.service;

import com.shortdrama.entity.Novel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NovelService {
    Novel createNovel(Novel novel);
    Novel updateNovel(UUID id, Novel novel);
    void deleteNovel(UUID id);
    Optional<Novel> findById(UUID id);
    Page<Novel> findByUserId(UUID userId, Pageable pageable);
    List<Novel> findByUserId(UUID userId);
    Page<Novel> findByStatus(Novel.NovelStatus status, Pageable pageable);
    Novel updateStatus(UUID id, Novel.NovelStatus status);
    Novel updateMetadata(UUID id, String metadata);
    long countByUserId(UUID userId);
    void recalculateStatus(UUID novelId);
}
