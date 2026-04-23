package com.shortdrama.repository;

import com.shortdrama.entity.Character;
import com.shortdrama.entity.Novel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CharacterRepository extends JpaRepository<Character, UUID> {

    List<Character> findByNovel(Novel novel);

    List<Character> findByNovelId(UUID novelId);

    List<Character> findByNovelAndStatus(Novel novel, Character.CharacterStatus status);

    Optional<Character> findByNovelAndName(Novel novel, String name);

    boolean existsByNovelAndName(Novel novel, String name);

    long countByNovel(Novel novel);
}
