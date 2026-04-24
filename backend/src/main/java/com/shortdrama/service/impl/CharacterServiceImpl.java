package com.shortdrama.service.impl;

import com.shortdrama.entity.Character;
import com.shortdrama.exception.ResourceNotFoundException;
import com.shortdrama.repository.CharacterRepository;
import com.shortdrama.service.CharacterService;
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
public class CharacterServiceImpl implements CharacterService {

    private final CharacterRepository characterRepository;

    @Override
    @Transactional
    public Character createCharacter(Character character) {
        return characterRepository.save(character);
    }

    @Override
    @Transactional
    public Character updateCharacter(UUID id, Character character) {
        Character existingCharacter = characterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Character", id.toString()));
        existingCharacter.setName(character.getName());
        existingCharacter.setGender(character.getGender());
        existingCharacter.setDescription(character.getDescription());
        existingCharacter.setPersonality(character.getPersonality());
        existingCharacter.setAppearance(character.getAppearance());
        existingCharacter.setReferenceImageUrl(character.getReferenceImageUrl());
        existingCharacter.setStatus(character.getStatus());
        return characterRepository.save(existingCharacter);
    }

    @Override
    @Transactional
    public void deleteCharacter(UUID id) {
        if (!characterRepository.existsById(id)) {
            throw new ResourceNotFoundException("Character", id.toString());
        }
        characterRepository.deleteById(id);
    }

    @Override
    public Optional<Character> findById(UUID id) {
        return characterRepository.findById(id);
    }

    @Override
    public List<Character> findByNovelId(UUID novelId) {
        return characterRepository.findByNovelId(novelId);
    }

    @Override
    public Page<Character> findByNovelId(UUID novelId, Pageable pageable) {
        return characterRepository.findByNovelId(novelId, pageable);
    }

    @Override
    public List<Character> findByNovelIdAndStatus(UUID novelId, Character.CharacterStatus status) {
        return characterRepository.findByNovelIdAndStatus(novelId, status);
    }

    @Override
    public Optional<Character> findByNovelIdAndName(UUID novelId, String name) {
        return characterRepository.findByNovelIdAndName(novelId, name);
    }

    @Override
    public boolean existsByNovelIdAndName(UUID novelId, String name) {
        return characterRepository.existsByNovelIdAndName(novelId, name);
    }

    @Override
    public long countByNovelId(UUID novelId) {
        return characterRepository.countByNovelId(novelId);
    }
}
