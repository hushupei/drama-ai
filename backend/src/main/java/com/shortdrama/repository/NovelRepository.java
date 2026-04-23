package com.shortdrama.repository;

import com.shortdrama.entity.Novel;
import com.shortdrama.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NovelRepository extends JpaRepository<Novel, UUID> {

    List<Novel> findByUser(User user);

    List<Novel> findByUserOrderByCreatedAtDesc(User user);

    @Query("SELECT n FROM Novel n LEFT JOIN FETCH n.chapters WHERE n.id = :id")
    Optional<Novel> findByIdWithChapters(@Param("id") UUID id);

    List<Novel> findByStatus(Novel.NovelStatus status);

    @Query("SELECT n FROM Novel n WHERE n.user.id = :userId AND n.status = :status")
    List<Novel> findByUserIdAndStatus(@Param("userId") UUID userId, @Param("status") Novel.NovelStatus status);
}
