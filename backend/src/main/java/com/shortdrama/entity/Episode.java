package com.shortdrama.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "episodes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Episode {

    @Id
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id")
    private Chapter chapter;

    @Column(nullable = false)
    private Integer episodeNumber;

    @Column(length = 255)
    private String title;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EpisodeStatus status = EpisodeStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String scriptContent;

    @Column(length = 500)
    private String videoUrl;

    @Column(length = 500)
    private String audioUrl;

    @Column
    private Integer duration;

    @Column
    private Integer wordCount;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column
    private LocalDateTime completedAt;

    public enum EpisodeStatus {
        PENDING, GENERATING_SCRIPT, GENERATING_SCENES, GENERATING_AUDIO, RENDERING_VIDEO, COMPLETED, FAILED
    }
}
