package com.shortdrama.repository;

import com.shortdrama.entity.Chapter;
import com.shortdrama.entity.Novel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChapterRepository extends JpaRepository<Chapter, UUID> {

    List<Chapter> findByNovelOrderByChapterNumberAsc(Novel novel);

    List<Chapter> findByNovelIdOrderByChapterNumberAsc(UUID novelId);

    List<Chapter> findByNovelId(UUID novelId);

    Page<Chapter> findByNovelId(UUID novelId, Pageable pageable);

    Optional<Chapter> findByNovelAndChapterNumber(Novel novel, Integer chapterNumber);

    @Query("SELECT COALESCE(MAX(c.chapterNumber), 0) FROM Chapter c WHERE c.novel.id = :novelId")
    Integer findMaxChapterNumberByNovelId(@Param("novelId") UUID novelId);

    long countByNovel(Novel novel);

    long countByNovelId(UUID novelId);

    @Query("SELECT SUM(c.wordCount) FROM Chapter c WHERE c.novel.id = :novelId")
    Integer sumWordCountByNovelId(@Param("novelId") UUID novelId);
}
