package com.shortdrama.repository;

import com.shortdrama.entity.Character;
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
class CharacterRepositoryTest {

    @Autowired
    private CharacterRepository characterRepository;

    @Autowired
    private NovelRepository novelRepository;

    @Autowired
    private UserRepository userRepository;

    private Novel testNovel;
    private Character testCharacter;

    @BeforeEach
    void setUp() {
        User user = User.builder()
                .username("charuser")
                .email("char@example.com")
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

        testCharacter = Character.builder()
                .novel(testNovel)
                .name("John Doe")
                .gender("Male")
                .description("Main character")
                .personality("Brave")
                .appearance("Tall")
                .status(Character.CharacterStatus.ACTIVE)
                .build();
    }

    @Test
    @DisplayName("Save character and find by ID")
    void save_andFindById_returnsCharacter() {
        Character saved = characterRepository.save(testCharacter);

        Optional<Character> found = characterRepository.findById(saved.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("John Doe");
    }

    @Test
    @DisplayName("Find by novel returns characters")
    void findByNovel_returnsCharacters() {
        characterRepository.save(testCharacter);

        List<Character> found = characterRepository.findByNovel(testNovel);

        assertThat(found).hasSize(1);
        assertThat(found.get(0).getName()).isEqualTo("John Doe");
    }

    @Test
    @DisplayName("Find by novel and status")
    void findByNovelAndStatus_returnsFilteredCharacters() {
        characterRepository.save(testCharacter);
        Character inactiveChar = Character.builder()
                .novel(testNovel)
                .name("Jane Doe")
                .status(Character.CharacterStatus.INACTIVE)
                .build();
        characterRepository.save(inactiveChar);

        List<Character> activeChars = characterRepository.findByNovelAndStatus(
                testNovel, Character.CharacterStatus.ACTIVE);

        assertThat(activeChars).hasSize(1);
        assertThat(activeChars.get(0).getName()).isEqualTo("John Doe");
    }

    @Test
    @DisplayName("Find by novel and name")
    void findByNovelAndName_returnsCharacter() {
        characterRepository.save(testCharacter);

        Optional<Character> found = characterRepository.findByNovelAndName(testNovel, "John Doe");

        assertThat(found).isPresent();
        assertThat(found.get().getDescription()).isEqualTo("Main character");
    }

    @Test
    @DisplayName("Exists by novel and name returns true")
    void existsByNovelAndName_existing_returnsTrue() {
        characterRepository.save(testCharacter);

        boolean exists = characterRepository.existsByNovelAndName(testNovel, "John Doe");

        assertThat(exists).isTrue();
    }

    @Test
    @DisplayName("Count by novel returns correct count")
    void countByNovel_returnsCorrectCount() {
        characterRepository.save(testCharacter);

        long count = characterRepository.countByNovel(testNovel);

        assertThat(count).isEqualTo(1);
    }
}
