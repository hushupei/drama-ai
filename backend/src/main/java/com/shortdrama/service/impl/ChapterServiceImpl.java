package com.shortdrama.service.impl;

import com.shortdrama.entity.Chapter;
import com.shortdrama.exception.ResourceNotFoundException;
import com.shortdrama.repository.ChapterRepository;
import com.shortdrama.service.ChapterService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChapterServiceImpl implements ChapterService {

    private final ChapterRepository chapterRepository;

    @Override
    @Transactional
    public Chapter createChapter(Chapter chapter) {
        return chapterRepository.save(chapter);
    }

    @Override
    @Transactional
    public Chapter updateChapter(UUID id, Chapter chapter) {
        Chapter existingChapter = chapterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chapter", id.toString()));
        existingChapter.setTitle(chapter.getTitle());
        existingChapter.setContent(chapter.getContent());
        existingChapter.setWordCount(chapter.getWordCount());
        return chapterRepository.save(existingChapter);
    }

    @Override
    @Transactional
    public void deleteChapter(UUID id) {
        if (!chapterRepository.existsById(id)) {
            throw new ResourceNotFoundException("Chapter", id.toString());
        }
        chapterRepository.deleteById(id);
    }

    @Override
    public Optional<Chapter> findById(UUID id) {
        return chapterRepository.findById(id);
    }

    @Override
    public List<Chapter> findByNovelId(UUID novelId) {
        return chapterRepository.findByNovelId(novelId);
    }

    @Override
    public Page<Chapter> findByNovelId(UUID novelId, Pageable pageable) {
        return chapterRepository.findByNovelId(novelId, pageable);
    }

    @Override
    public Integer findMaxChapterNumber(UUID novelId) {
        return chapterRepository.findMaxChapterNumberByNovelId(novelId);
    }

    @Override
    public Integer sumWordCountByNovelId(UUID novelId) {
        return chapterRepository.sumWordCountByNovelId(novelId);
    }

    @Override
    public long countByNovelId(UUID novelId) {
        return chapterRepository.countByNovelId(novelId);
    }
}
