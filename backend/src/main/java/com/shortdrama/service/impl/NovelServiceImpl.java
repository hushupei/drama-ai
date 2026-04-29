package com.shortdrama.service.impl;

import com.shortdrama.entity.Novel;
import com.shortdrama.entity.Project;
import com.shortdrama.exception.ResourceNotFoundException;
import com.shortdrama.repository.NovelRepository;
import com.shortdrama.repository.ProjectRepository;
import com.shortdrama.service.NovelService;
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
public class NovelServiceImpl implements NovelService {

    private final NovelRepository novelRepository;
    private final ProjectRepository projectRepository;

    @Override
    @Transactional
    public Novel createNovel(Novel novel) {
        return novelRepository.save(novel);
    }

    @Override
    @Transactional
    public Novel updateNovel(UUID id, Novel novel) {
        Novel existingNovel = novelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Novel", id.toString()));
        
        existingNovel.setTitle(novel.getTitle());
        existingNovel.setDescription(novel.getDescription());
        existingNovel.setAuthor(novel.getAuthor());
        
        return novelRepository.save(existingNovel);
    }

    @Override
    @Transactional
    public void deleteNovel(UUID id) {
        if (!novelRepository.existsById(id)) {
            throw new ResourceNotFoundException("Novel", id.toString());
        }
        novelRepository.deleteById(id);
    }

    @Override
    public Optional<Novel> findById(UUID id) {
        return novelRepository.findById(id);
    }

    @Override
    public Page<Novel> findByUserId(UUID userId, Pageable pageable) {
        return novelRepository.findByUserId(userId, pageable);
    }

    @Override
    public List<Novel> findByUserId(UUID userId) {
        return novelRepository.findByUserId(userId);
    }

    @Override
    public Page<Novel> findByStatus(Novel.NovelStatus status, Pageable pageable) {
        return novelRepository.findByStatus(status, pageable);
    }

    @Override
    @Transactional
    public Novel updateStatus(UUID id, Novel.NovelStatus status) {
        Novel novel = novelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Novel", id.toString()));
        novel.setStatus(status);
        return novelRepository.save(novel);
    }

    @Override
    @Transactional
    public Novel updateMetadata(UUID id, String metadata) {
        Novel novel = novelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Novel", id.toString()));
        novel.setMetadata(metadata);
        return novelRepository.save(novel);
    }

    @Override
    public long countByUserId(UUID userId) {
        return novelRepository.countByUserId(userId);
    }

    @Override
    @Transactional
    public void recalculateStatus(UUID novelId) {
        Novel novel = novelRepository.findById(novelId)
                .orElseThrow(() -> new ResourceNotFoundException("Novel", novelId.toString()));
        List<Project> projects = projectRepository.findByNovelId(novelId);

        if (projects.isEmpty()) {
            return;
        }

        boolean allCompleted = projects.stream()
                .allMatch(p -> p.getStatus() == Project.ProjectStatus.COMPLETED);
        boolean anyProcessing = projects.stream()
                .anyMatch(p -> p.getStatus() == Project.ProjectStatus.IN_PROGRESS);

        Novel.NovelStatus newStatus;
        if (allCompleted) {
            newStatus = Novel.NovelStatus.COMPLETED;
        } else if (anyProcessing) {
            newStatus = Novel.NovelStatus.PROCESSING;
        } else {
            return;
        }

        if (novel.getStatus() != newStatus) {
            novel.setStatus(newStatus);
            novelRepository.save(novel);
        }
    }
}
