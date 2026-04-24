package com.shortdrama.service;

import com.shortdrama.entity.Novel;
import com.shortdrama.entity.User;
import com.shortdrama.exception.ResourceNotFoundException;
import com.shortdrama.repository.NovelRepository;
import com.shortdrama.service.impl.NovelServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NovelService Tests")
class NovelServiceTest {

    @Mock
    private NovelRepository novelRepository;

    @InjectMocks
    private NovelServiceImpl novelService;

    private Novel testNovel;
    private UUID testId;
    private UUID testUserId;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        testUserId = UUID.randomUUID();
        User user = User.builder()
                .id(testUserId)
                .username("testuser")
                .email("test@example.com")
                .build();
        testNovel = Novel.builder()
                .id(testId)
                .user(user)
                .title("Test Novel")
                .description("Test Description")
                .author("Test Author")
                .status(Novel.NovelStatus.UPLOADED)
                .build();
    }

    @Test
    @DisplayName("Should create novel successfully")
    void createNovel_shouldReturnSavedNovel() {
        when(novelRepository.save(any(Novel.class))).thenReturn(testNovel);

        Novel result = novelService.createNovel(testNovel);

        assertThat(result).isNotNull();
        assertThat(result.getTitle()).isEqualTo("Test Novel");
        verify(novelRepository).save(testNovel);
    }

    @Test
    @DisplayName("Should update novel successfully")
    void updateNovel_shouldReturnUpdatedNovel() {
        Novel updatedNovel = Novel.builder()
                .title("Updated Title")
                .description("Updated Description")
                .author("Updated Author")
                .build();
        when(novelRepository.findById(testId)).thenReturn(Optional.of(testNovel));
        when(novelRepository.save(any(Novel.class))).thenReturn(testNovel);

        Novel result = novelService.updateNovel(testId, updatedNovel);

        assertThat(result).isNotNull();
        verify(novelRepository).findById(testId);
        verify(novelRepository).save(testNovel);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when updating non-existent novel")
    void updateNovel_shouldThrowResourceNotFoundException() {
        UUID nonExistentId = UUID.randomUUID();
        when(novelRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> novelService.updateNovel(nonExistentId, testNovel))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Novel not found");
        verify(novelRepository).findById(nonExistentId);
        verify(novelRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should delete novel successfully")
    void deleteNovel_shouldDeleteNovel() {
        when(novelRepository.existsById(testId)).thenReturn(true);
        doNothing().when(novelRepository).deleteById(testId);

        novelService.deleteNovel(testId);

        verify(novelRepository).existsById(testId);
        verify(novelRepository).deleteById(testId);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when deleting non-existent novel")
    void deleteNovel_shouldThrowResourceNotFoundException() {
        UUID nonExistentId = UUID.randomUUID();
        when(novelRepository.existsById(nonExistentId)).thenReturn(false);

        assertThatThrownBy(() -> novelService.deleteNovel(nonExistentId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Novel not found");
        verify(novelRepository).existsById(nonExistentId);
        verify(novelRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("Should find novel by id")
    void findById_shouldReturnNovel() {
        when(novelRepository.findById(testId)).thenReturn(Optional.of(testNovel));

        Optional<Novel> result = novelService.findById(testId);

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(testId);
    }

    @Test
    @DisplayName("Should return empty optional when novel not found")
    void findById_shouldReturnEmptyOptional() {
        UUID nonExistentId = UUID.randomUUID();
        when(novelRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        Optional<Novel> result = novelService.findById(nonExistentId);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("Should find novels by user id with pagination")
    void findByUserId_withPageable_shouldReturnPagedNovels() {
        Pageable pageable = PageRequest.of(0, 10);
        List<Novel> novels = Arrays.asList(testNovel);
        Page<Novel> novelPage = new PageImpl<>(novels, pageable, novels.size());
        when(novelRepository.findByUserId(testUserId, pageable)).thenReturn(novelPage);

        Page<Novel> result = novelService.findByUserId(testUserId, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getTitle()).isEqualTo("Test Novel");
    }

    @Test
    @DisplayName("Should update novel status successfully")
    void updateStatus_shouldReturnNovelWithUpdatedStatus() {
        when(novelRepository.findById(testId)).thenReturn(Optional.of(testNovel));
        when(novelRepository.save(any(Novel.class))).thenReturn(testNovel);

        Novel result = novelService.updateStatus(testId, Novel.NovelStatus.PROCESSING);

        assertThat(result).isNotNull();
        verify(novelRepository).findById(testId);
        verify(novelRepository).save(testNovel);
    }

    @Test
    @DisplayName("Should count novels by user id")
    void countByUserId_shouldReturnCount() {
        when(novelRepository.countByUserId(testUserId)).thenReturn(5L);

        long result = novelService.countByUserId(testUserId);

        assertThat(result).isEqualTo(5L);
    }
}
