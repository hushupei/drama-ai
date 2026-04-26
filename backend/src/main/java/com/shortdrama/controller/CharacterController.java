package com.shortdrama.controller;

import com.shortdrama.dto.request.CreateCharacterRequest;
import com.shortdrama.dto.response.ApiResponse;
import com.shortdrama.entity.Character;
import com.shortdrama.entity.Novel;
import com.shortdrama.service.CharacterService;
import com.shortdrama.service.NovelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/novels/{novelId}/characters")
@RequiredArgsConstructor
public class CharacterController {

    private final CharacterService characterService;
    private final NovelService novelService;

    @PostMapping
    public ResponseEntity<ApiResponse<Character>> create(
            @PathVariable UUID novelId,
            @Valid @RequestBody CreateCharacterRequest request) {
        Novel novel = novelService.findById(novelId)
                .orElseThrow(() -> new RuntimeException("Novel not found"));

        Character character = Character.builder()
                .novel(novel)
                .name(request.getName())
                .gender(request.getGender())
                .description(request.getDescription())
                .personality(request.getPersonality())
                .appearance(request.getAppearance())
                .referenceImageUrl(request.getReferenceImageUrl())
                .status(Character.CharacterStatus.ACTIVE)
                .build();

        Character created = characterService.createCharacter(character);
        return ResponseEntity.ok(ApiResponse.success("Character created", created));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Character>>> getByNovelId(@PathVariable UUID novelId) {
        List<Character> characters = characterService.findByNovelId(novelId);
        return ResponseEntity.ok(ApiResponse.success(characters));
    }

    @GetMapping("/paged")
    public ResponseEntity<ApiResponse<Page<Character>>> getByNovelIdPaged(
            @PathVariable UUID novelId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        Page<Character> characters = characterService.findByNovelId(novelId, pageable);
        return ResponseEntity.ok(ApiResponse.success(characters));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Character>> getById(
            @PathVariable UUID novelId,
            @PathVariable UUID id) {
        Character character = characterService.findById(id)
                .orElseThrow(() -> new RuntimeException("Character not found"));
        return ResponseEntity.ok(ApiResponse.success(character));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Character>> update(
            @PathVariable UUID novelId,
            @PathVariable UUID id,
            @Valid @RequestBody CreateCharacterRequest request) {
        Character character = Character.builder()
                .name(request.getName())
                .gender(request.getGender())
                .description(request.getDescription())
                .personality(request.getPersonality())
                .appearance(request.getAppearance())
                .referenceImageUrl(request.getReferenceImageUrl())
                .build();

        Character updated = characterService.updateCharacter(id, character);
        return ResponseEntity.ok(ApiResponse.success("Character updated", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID novelId,
            @PathVariable UUID id) {
        characterService.deleteCharacter(id);
        return ResponseEntity.ok(ApiResponse.success("Character deleted", null));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<Character>>> getByStatus(
            @PathVariable UUID novelId,
            @PathVariable Character.CharacterStatus status) {
        List<Character> characters = characterService.findByNovelIdAndStatus(novelId, status);
        return ResponseEntity.ok(ApiResponse.success(characters));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Character>> getByName(
            @PathVariable UUID novelId,
            @RequestParam String name) {
        Character character = characterService.findByNovelIdAndName(novelId, name)
                .orElseThrow(() -> new RuntimeException("Character not found"));
        return ResponseEntity.ok(ApiResponse.success(character));
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> count(@PathVariable UUID novelId) {
        long count = characterService.countByNovelId(novelId);
        return ResponseEntity.ok(ApiResponse.success(count));
    }
}