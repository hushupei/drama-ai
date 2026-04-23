package com.shortdrama.repository;

import com.shortdrama.entity.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;CASE_INSENSITIVE_IDENTIFIERS=true",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
    "spring.liquibase.enabled=false"
})
class EpisodeRepositoryTest {

    @Autowired
    private EpisodeRepository episodeRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ChapterRepository chapterRepository;

    @Autowired
    private NovelRepository novelRepository;

    @Autowired
    private UserRepository userRepository;

    private Project testProject;
    private Chapter testChapter;
    private Episode testEpisode;

    @BeforeEach
    void setUp() {
        User user = User.builder()
                .username("episodeuser")
                .email("episode@example.com")
                .passwordHash("hashed_password")
                .role(User.Role.USER)
                .status(User.UserStatus.ACTIVE)
                .build();
        user = userRepository.save(user);

        Novel novel = Novel.builder()
                .user(user)
                .title("Test Novel")
                .status(Novel.NovelStatus.UPLOADED)
                .build();
        novel = novelRepository.save(novel);

        testProject = Project.builder()
                .user(user)
                .novel(novel)
                .name("Test Project")
                .status(Project.ProjectStatus.DRAFT)
                .type(Project.ProjectType.SINGLE_EPISODE)
                .build();
        testProject = projectRepository.save(testProject);

        testChapter = Chapter.builder()
                .novel(novel)
                .chapterNumber(1)
                .title("Chapter 1")
                .wordCount(100)
                .build();
        testChapter = chapterRepository.save(testChapter);

        testEpisode = Episode.builder()
                .project(testProject)
                .chapter(testChapter)
                .episodeNumber(1)
                .title("Episode 1")
                .description("First episode")
                .status(Episode.EpisodeStatus.PENDING)
                .duration(60)
                .wordCount(100)
                .build();
    }

    @Test
    @DisplayName("Save episode and find by ID")
    void save_andFindById_returnsEpisode() {
        Episode saved = episodeRepository.save(testEpisode);

        Optional<Episode> found = episodeRepository.findById(saved.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getTitle()).isEqualTo("Episode 1");
    }

    @Test
    @DisplayName("Find by project ordered by episode number")
    void findByProjectOrderByEpisodeNumberAsc_returnsOrderedEpisodes() {
        episodeRepository.save(testEpisode);
        Episode episode2 = Episode.builder()
                .project(testProject)
                .episodeNumber(2)
                .title("Episode 2")
                .status(Episode.EpisodeStatus.PENDING)
                .build();
        episodeRepository.save(episode2);

        List<Episode> found = episodeRepository.findByProjectOrderByEpisodeNumberAsc(testProject);

        assertThat(found).hasSize(2);
        assertThat(found.get(0).getEpisodeNumber()).isEqualTo(1);
        assertThat(found.get(1).getEpisodeNumber()).isEqualTo(2);
    }

    @Test
    @DisplayName("Find by project and episode number")
    void findByProjectAndEpisodeNumber_returnsEpisode() {
        episodeRepository.save(testEpisode);

        Optional<Episode> found = episodeRepository.findByProjectAndEpisodeNumber(testProject, 1);

        assertThat(found).isPresent();
        assertThat(found.get().getTitle()).isEqualTo("Episode 1");
    }

    @Test
    @DisplayName("Find by project and status")
    void findByProjectAndStatus_returnsFilteredEpisodes() {
        episodeRepository.save(testEpisode);
        Episode completedEpisode = Episode.builder()
                .project(testProject)
                .episodeNumber(2)
                .title("Episode 2")
                .status(Episode.EpisodeStatus.COMPLETED)
                .build();
        episodeRepository.save(completedEpisode);

        List<Episode> pendingEpisodes = episodeRepository.findByProjectAndStatus(
                testProject, Episode.EpisodeStatus.PENDING);

        assertThat(pendingEpisodes).hasSize(1);
        assertThat(pendingEpisodes.get(0).getTitle()).isEqualTo("Episode 1");
    }

    @Test
    @DisplayName("Find by chapter ID")
    void findByChapterId_returnsEpisodes() {
        episodeRepository.save(testEpisode);

        List<Episode> found = episodeRepository.findByChapterId(testChapter.getId());

        assertThat(found).hasSize(1);
    }

    @Test
    @DisplayName("Count by project returns correct count")
    void countByProject_returnsCorrectCount() {
        episodeRepository.save(testEpisode);

        long count = episodeRepository.countByProject(testProject);

        assertThat(count).isEqualTo(1);
    }

    @Test
    @DisplayName("Count by project and status")
    void countByProjectAndStatus_returnsCorrectCount() {
        episodeRepository.save(testEpisode);

        long count = episodeRepository.countByProjectAndStatus(
                testProject, Episode.EpisodeStatus.PENDING);

        assertThat(count).isEqualTo(1);
    }
}
