package com.shortdrama.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Episode {

    @Id
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @JsonBackReference("project-episodes")
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
    private EpisodeStatus status = EpisodeStatus.DRAFT;

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

    @Column(length = 32)
    private String failedStep;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    @Column
    private Integer scriptWordCount;

    @Column
    private Integer videoDuration;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column
    private LocalDateTime completedAt;

    public enum EpisodeStatus {
        DRAFT, SCRIPT_GENERATING, SCRIPT_READY, VIDEO_GENERATING, COMPLETED, FAILED
    }
}
