package com.shortdrama.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shortdrama.entity.User;
import com.shortdrama.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@WithMockUser(username = "testuser")
public class NovelApiIntegrationTest {

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
    void testCreateAndGetNovel() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-novel.txt",
                MediaType.TEXT_PLAIN_VALUE,
                "This is a test novel content".getBytes()
        );

        MvcResult createResult = mockMvc.perform(multipart("/api/novels")
                .file(file)
                .param("title", "Test Novel")
                .param("author", "Test Author"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Test Novel"))
                .andReturn();

        String novelId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        mockMvc.perform(get("/api/novels/" + novelId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Test Novel"));
    }

    @Test
    void testGetAllNovels() throws Exception {
        mockMvc.perform(get("/api/novels"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void testUploadNovelFile() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-novel.txt",
                MediaType.TEXT_PLAIN_VALUE,
                "This is a test novel content".getBytes()
        );

        mockMvc.perform(multipart("/api/novels")
                .file(file)
                .param("title", "Uploaded Novel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void testDeleteNovel() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-delete-novel.txt",
                MediaType.TEXT_PLAIN_VALUE,
                "This is a test novel content".getBytes()
        );

        MvcResult createResult = mockMvc.perform(multipart("/api/novels")
                .file(file)
                .param("title", "Delete Test Novel")
                .param("author", "Test Author"))
                .andExpect(status().isOk())
                .andReturn();

        String novelId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        mockMvc.perform(delete("/api/novels/" + novelId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
