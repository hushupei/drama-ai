package com.shortdrama.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shortdrama.dto.request.CreateNovelRequest;
import com.shortdrama.dto.request.UpdateNovelRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class NovelApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testCreateAndGetNovel() throws Exception {
        // Create novel
        CreateNovelRequest request = new CreateNovelRequest();
        request.setTitle("Test Novel");
        request.setAuthor("Test Author");

        MvcResult createResult = mockMvc.perform(post("/api/novels")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Test Novel"))
                .andReturn();

        String novelId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // Get novel
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

        mockMvc.perform(multipart("/api/novels/upload")
                .file(file)
                .param("title", "Uploaded Novel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void testDeleteNovel() throws Exception {
        // Create novel first
        CreateNovelRequest request = new CreateNovelRequest();
        request.setTitle("Delete Test Novel");
        request.setAuthor("Test Author");

        MvcResult createResult = mockMvc.perform(post("/api/novels")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        String novelId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // Delete novel
        mockMvc.perform(delete("/api/novels/" + novelId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
