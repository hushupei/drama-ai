package com.shortdrama.service;

import com.shortdrama.entity.Character;
import com.shortdrama.entity.Novel;
import com.shortdrama.exception.ResourceNotFoundException;
import com.shortdrama.repository.CharacterRepository;
import com.shortdrama.service.impl.CharacterServiceImpl;
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
@DisplayName("CharacterService Tests")
class CharacterServiceTest {

    @Mock private CharacterRepository characterRepository;
    @InjectMocks private CharacterServiceImpl characterService;

    private Character testCharacter;
    private UUID testId;
    private UUID novelId;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        novelId = UUID.randomUUID();
        Novel novel = Novel.builder().id(novelId).title("Test Novel").build();
        testCharacter = Character.builder()
                .id(testId)
                .novel(novel)
                .name("Test Character")
                .gender("Male")
                .description("A test character")
                .status(Character.CharacterStatus.ACTIVE)
                .build();
    }

    @Test
    @DisplayName("Should create character successfully")
    void createCharacter_shouldReturnSavedCharacter() {
        when(characterRepository.save(any(Character.class))).thenReturn(testCharacter);
        Character result = characterService.createCharacter(testCharacter);
        assertThat(result.getName()).isEqualTo("Test Character");
    }

    @Test
    @DisplayName("Should update character successfully")
    void updateCharacter_shouldReturnUpdatedCharacter() {
        Character updated = Character.builder()
                .name("Updated Name")
                .description("Updated description")
                .gender("Female")
                .build();
        when(characterRepository.findById(testId)).thenReturn(Optional.of(testCharacter));
        when(characterRepository.save(any(Character.class))).thenReturn(testCharacter);
        Character result = characterService.updateCharacter(testId, updated);
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("Should find characters by novel id")
    void findByNovelId_shouldReturnCharacters() {
        when(characterRepository.findByNovelId(novelId))
                .thenReturn(Arrays.asList(testCharacter));
        var result = characterService.findByNovelId(novelId);
        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("Should find characters by novel id and status")
    void findByNovelIdAndStatus_shouldReturnFilteredCharacters() {
        when(characterRepository.findByNovelIdAndStatus(novelId, Character.CharacterStatus.ACTIVE))
                .thenReturn(Arrays.asList(testCharacter));
        var result = characterService.findByNovelIdAndStatus(novelId, Character.CharacterStatus.ACTIVE);
        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("Should check if character exists by novel id and name")
    void existsByNovelIdAndName_shouldReturnTrue() {
        when(characterRepository.existsByNovelIdAndName(novelId, "Test Character")).thenReturn(true);
        assertThat(characterService.existsByNovelIdAndName(novelId, "Test Character")).isTrue();
    }

    @Test
    @DisplayName("Should count characters by novel id")
    void countByNovelId_shouldReturnCount() {
        when(characterRepository.countByNovelId(novelId)).thenReturn(5L);
        assertThat(characterService.countByNovelId(novelId)).isEqualTo(5L);
    }
}
