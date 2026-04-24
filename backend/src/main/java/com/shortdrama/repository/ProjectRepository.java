package com.shortdrama.repository;

import com.shortdrama.entity.Project;
import com.shortdrama.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {

    List<Project> findByUserOrderByCreatedAtDesc(User user);

    List<Project> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Page<Project> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    @Query("SELECT p FROM Project p LEFT JOIN FETCH p.episodes WHERE p.id = :id")
    Optional<Project> findByIdWithEpisodes(@Param("id") UUID id);

    List<Project> findByNovelId(UUID novelId);

    List<Project> findByUserAndStatus(User user, Project.ProjectStatus status);

    List<Project> findByUserIdAndStatus(UUID userId, Project.ProjectStatus status);

    long countByUser(User user);

    long countByNovelId(UUID novelId);
}
