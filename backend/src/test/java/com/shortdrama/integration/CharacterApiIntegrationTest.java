package com.shortdrama.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shortdrama.dto.request.CreateCharacterRequest;
import com.shortdrama.entity.User;
import com.shortdrama.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@WithMockUser(username = "testuser")
public class CharacterApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @MockBean
    private com.shortdrama.service.StorageService storageService;

    @BeforeEach
    void setUp() {
        if (!userRepository.existsByUsername("testuser")) {
            User user = User.builder()
                    .username("testuser")
                    .email("testuser@test.com")
                    .passwordHash("test-hash")
                    .role(User.Role.USER)
                    .status(User.UserStatus.ACTIVE)
                    .build();
            userRepository.save(user);
        }
        when(storageService.uploadFile(anyString(), anyString(), any(), anyLong(), anyString()))
                .thenReturn("mock-object-name");
    }

    @Test
    void testCreateAndGetCharacter() throws Exception {
        UUID novelId = createTestNovel();
        String novelIdStr = novelId.toString();

        CreateCharacterRequest request = new CreateCharacterRequest();
        request.setName("Test Character");
        request.setDescription("A test character description");
        request.setNovelId(novelId);

        MvcResult createResult = mockMvc.perform(post("/api/novels/" + novelIdStr + "/characters")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Test Character"))
                .andReturn();

        String characterId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        mockMvc.perform(get("/api/novels/" + novelIdStr + "/characters/" + characterId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Test Character"));
    }

    @Test
    void testGetAllCharacters() throws Exception {
        UUID novelId = createTestNovel();

        mockMvc.perform(get("/api/novels/" + novelId + "/characters"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void testUpdateCharacter() throws Exception {
        UUID novelId = createTestNovel();
        UUID characterId = createTestCharacter(novelId);

        CreateCharacterRequest updateRequest = new CreateCharacterRequest();
        updateRequest.setNovelId(novelId);
        updateRequest.setName("Updated Character Name");
        updateRequest.setDescription("Updated description");

        mockMvc.perform(put("/api/novels/" + novelId + "/characters/" + characterId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Updated Character Name"));
    }

    @Test
    void testCharacterDefaultActive() throws Exception {
        UUID novelId = createTestNovel();
        UUID characterId = createTestCharacter(novelId);

        mockMvc.perform(get("/api/novels/" + novelId + "/characters/" + characterId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    private UUID createTestNovel() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-novel.txt",
                MediaType.TEXT_PLAIN_VALUE,
                "This is a test novel content".getBytes()
        );

        MvcResult result = mockMvc.perform(multipart("/api/novels")
                .file(file)
                .param("title", "Test Novel for Character")
                .param("author", "Test Author"))
                .andExpect(status().isOk())
                .andReturn();

        String idStr = objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("id").asText();
        return UUID.fromString(idStr);
    }

    private UUID createTestCharacter(UUID novelId) throws Exception {
        CreateCharacterRequest request = new CreateCharacterRequest();
        request.setNovelId(novelId);
        request.setName("Test Character");
        request.setDescription("Test description");

        MvcResult result = mockMvc.perform(post("/api/novels/" + novelId + "/characters")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        String idStr = objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("id").asText();
        return UUID.fromString(idStr);
    }
}
