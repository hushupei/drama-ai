package com.shortdrama.repository;

import com.shortdrama.entity.Character;
import com.shortdrama.entity.Novel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CharacterRepository extends JpaRepository<Character, UUID> {

    List<Character> findByNovel(Novel novel);

    List<Character> findByNovelId(UUID novelId);

    Page<Character> findByNovelId(UUID novelId, Pageable pageable);

    List<Character> findByNovelAndStatus(Novel novel, Character.CharacterStatus status);

    List<Character> findByNovelIdAndStatus(UUID novelId, Character.CharacterStatus status);

    Optional<Character> findByNovelAndName(Novel novel, String name);

    Optional<Character> findByNovelIdAndName(UUID novelId, String name);

    boolean existsByNovelAndName(Novel novel, String name);

    boolean existsByNovelIdAndName(UUID novelId, String name);

    long countByNovel(Novel novel);

    long countByNovelId(UUID novelId);
}
