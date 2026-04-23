package com.shortdrama.repository;

import com.shortdrama.entity.Novel;
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
class NovelRepositoryTest {

    @Autowired
    private NovelRepository novelRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUser;
    private Novel testNovel;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .username("noveluser")
                .email("novel@example.com")
                .passwordHash("hashed_password")
                .role(User.Role.USER)
                .status(User.UserStatus.ACTIVE)
                .build();
        testUser = userRepository.save(testUser);

        testNovel = Novel.builder()
                .user(testUser)
                .title("Test Novel")
                .description("A test novel")
                .author("Test Author")
                .status(Novel.NovelStatus.UPLOADED)
                .fileSize(1024L)
                .build();
    }

    @Test
    @DisplayName("Save novel and find by ID")
    void save_andFindById_returnsNovel() {
        Novel saved = novelRepository.save(testNovel);

        Optional<Novel> found = novelRepository.findById(saved.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getTitle()).isEqualTo("Test Novel");
    }

    @Test
    @DisplayName("Find by user returns novels for that user")
    void findByUser_returnsUserNovels() {
        novelRepository.save(testNovel);

        List<Novel> found = novelRepository.findByUser(testUser);

        assertThat(found).hasSize(1);
        assertThat(found.get(0).getTitle()).isEqualTo("Test Novel");
    }

    @Test
    @DisplayName("Find by user ordered by created at desc")
    void findByUserOrderByCreatedAtDesc_returnsOrderedNovels() {
        novelRepository.save(testNovel);
        Novel secondNovel = Novel.builder()
                .user(testUser)
                .title("Second Novel")
                .status(Novel.NovelStatus.UPLOADED)
                .build();
        novelRepository.save(secondNovel);

        List<Novel> found = novelRepository.findByUserOrderByCreatedAtDesc(testUser);

        assertThat(found).hasSize(2);
        assertThat(found.get(0).getTitle()).isEqualTo("Second Novel");
    }

    @Test
    @DisplayName("Find by status returns matching novels")
    void findByStatus_returnsMatchingNovels() {
        novelRepository.save(testNovel);

        List<Novel> found = novelRepository.findByStatus(Novel.NovelStatus.UPLOADED);

        assertThat(found).hasSize(1);
        assertThat(found.get(0).getStatus()).isEqualTo(Novel.NovelStatus.UPLOADED);
    }

    @Test
    @DisplayName("Find by user ID and status returns matching novels")
    void findByUserIdAndStatus_returnsMatchingNovels() {
        novelRepository.save(testNovel);

        List<Novel> found = novelRepository.findByUserIdAndStatus(
                testUser.getId(), Novel.NovelStatus.UPLOADED);

        assertThat(found).hasSize(1);
    }
}
