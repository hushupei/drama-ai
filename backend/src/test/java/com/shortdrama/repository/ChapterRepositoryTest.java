package com.shortdrama.repository;

import com.shortdrama.entity.Chapter;
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
class ChapterRepositoryTest {

    @Autowired
    private ChapterRepository chapterRepository;

    @Autowired
    private NovelRepository novelRepository;

    @Autowired
    private UserRepository userRepository;

    private Novel testNovel;
    private Chapter testChapter;

    @BeforeEach
    void setUp() {
        User user = User.builder()
                .username("chapteruser")
                .email("chapter@example.com")
                .passwordHash("hashed_password")
                .role(User.Role.USER)
                .status(User.UserStatus.ACTIVE)
                .build();
        user = userRepository.save(user);

        testNovel = Novel.builder()
                .user(user)
                .title("Test Novel")
                .status(Novel.NovelStatus.UPLOADED)
                .build();
        testNovel = novelRepository.save(testNovel);

        testChapter = Chapter.builder()
                .novel(testNovel)
                .chapterNumber(1)
                .title("Chapter 1")
                .content("This is chapter content")
                .wordCount(100)
                .build();
    }

    @Test
    @DisplayName("Save chapter and find by ID")
    void save_andFindById_returnsChapter() {
        Chapter saved = chapterRepository.save(testChapter);

        Optional<Chapter> found = chapterRepository.findById(saved.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getTitle()).isEqualTo("Chapter 1");
    }

    @Test
    @DisplayName("Find by novel ordered by chapter number")
    void findByNovelOrderByChapterNumberAsc_returnsOrderedChapters() {
        chapterRepository.save(testChapter);
        Chapter chapter2 = Chapter.builder()
                .novel(testNovel)
                .chapterNumber(2)
                .title("Chapter 2")
                .wordCount(200)
                .build();
        chapterRepository.save(chapter2);

        List<Chapter> found = chapterRepository.findByNovelOrderByChapterNumberAsc(testNovel);

        assertThat(found).hasSize(2);
        assertThat(found.get(0).getChapterNumber()).isEqualTo(1);
        assertThat(found.get(1).getChapterNumber()).isEqualTo(2);
    }

    @Test
    @DisplayName("Find max chapter number by novel ID")
    void findMaxChapterNumberByNovelId_returnsMaxNumber() {
        chapterRepository.save(testChapter);
        Chapter chapter2 = Chapter.builder()
                .novel(testNovel)
                .chapterNumber(5)
                .title("Chapter 5")
                .build();
        chapterRepository.save(chapter2);

        Integer maxNumber = chapterRepository.findMaxChapterNumberByNovelId(testNovel.getId());

        assertThat(maxNumber).isEqualTo(5);
    }

    @Test
    @DisplayName("Count by novel returns correct count")
    void countByNovel_returnsCorrectCount() {
        chapterRepository.save(testChapter);

        long count = chapterRepository.countByNovel(testNovel);

        assertThat(count).isEqualTo(1);
    }

    @Test
    @DisplayName("Sum word count by novel ID")
    void sumWordCountByNovelId_returnsTotalWords() {
        chapterRepository.save(testChapter);
        Chapter chapter2 = Chapter.builder()
                .novel(testNovel)
                .chapterNumber(2)
                .wordCount(200)
                .build();
        chapterRepository.save(chapter2);

        Integer totalWords = chapterRepository.sumWordCountByNovelId(testNovel.getId());

        assertThat(totalWords).isEqualTo(300);
    }
}
