package com.shortdrama.service;

import com.shortdrama.entity.Character;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CharacterService {
    Character createCharacter(Character character);
    Character updateCharacter(UUID id, Character character);
    void deleteCharacter(UUID id);
    Optional<Character> findById(UUID id);
    List<Character> findByNovelId(UUID novelId);
    Page<Character> findByNovelId(UUID novelId, Pageable pageable);
    List<Character> findByNovelIdAndStatus(UUID novelId, Character.CharacterStatus status);
    Optional<Character> findByNovelIdAndName(UUID novelId, String name);
    boolean existsByNovelIdAndName(UUID novelId, String name);
    long countByNovelId(UUID novelId);
}
