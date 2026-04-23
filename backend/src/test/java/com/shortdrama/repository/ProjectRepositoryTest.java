package com.shortdrama.repository;

import com.shortdrama.entity.Novel;
import com.shortdrama.entity.Project;
import com.shortdrama.entity.User;
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
class ProjectRepositoryTest {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private NovelRepository novelRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUser;
    private Novel testNovel;
    private Project testProject;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .username("projectuser")
                .email("project@example.com")
                .passwordHash("hashed_password")
                .role(User.Role.USER)
                .status(User.UserStatus.ACTIVE)
                .build();
        testUser = userRepository.save(testUser);

        testNovel = Novel.builder()
                .user(testUser)
                .title("Test Novel")
                .status(Novel.NovelStatus.UPLOADED)
                .build();
        testNovel = novelRepository.save(testNovel);

        testProject = Project.builder()
                .user(testUser)
                .novel(testNovel)
                .name("Test Project")
                .description("A test project")
                .status(Project.ProjectStatus.DRAFT)
                .type(Project.ProjectType.SINGLE_EPISODE)
                .targetEpisodeCount(1)
                .targetDuration(60)
                .build();
    }

    @Test
    @DisplayName("Save project and find by ID")
    void save_andFindById_returnsProject() {
        Project saved = projectRepository.save(testProject);

        Optional<Project> found = projectRepository.findById(saved.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Test Project");
    }

    @Test
    @DisplayName("Find by user ordered by created at desc")
    void findByUserOrderByCreatedAtDesc_returnsOrderedProjects() {
        projectRepository.save(testProject);

        List<Project> found = projectRepository.findByUserOrderByCreatedAtDesc(testUser);

        assertThat(found).hasSize(1);
        assertThat(found.get(0).getName()).isEqualTo("Test Project");
    }

    @Test
    @DisplayName("Find by novel ID")
    void findByNovelId_returnsProjects() {
        projectRepository.save(testProject);

        List<Project> found = projectRepository.findByNovelId(testNovel.getId());

        assertThat(found).hasSize(1);
    }

    @Test
    @DisplayName("Find by user and status")
    void findByUserAndStatus_returnsFilteredProjects() {
        projectRepository.save(testProject);
        Project completedProject = Project.builder()
                .user(testUser)
                .novel(testNovel)
                .name("Completed Project")
                .status(Project.ProjectStatus.COMPLETED)
                .type(Project.ProjectType.SINGLE_EPISODE)
                .build();
        projectRepository.save(completedProject);

        List<Project> draftProjects = projectRepository.findByUserAndStatus(
                testUser, Project.ProjectStatus.DRAFT);

        assertThat(draftProjects).hasSize(1);
        assertThat(draftProjects.get(0).getName()).isEqualTo("Test Project");
    }

    @Test
    @DisplayName("Count by user returns correct count")
    void countByUser_returnsCorrectCount() {
        projectRepository.save(testProject);

        long count = projectRepository.countByUser(testUser);

        assertThat(count).isEqualTo(1);
    }

    @Test
    @DisplayName("Count by novel ID returns correct count")
    void countByNovelId_returnsCorrectCount() {
        projectRepository.save(testProject);

        long count = projectRepository.countByNovelId(testNovel.getId());

        assertThat(count).isEqualTo(1);
    }
}
