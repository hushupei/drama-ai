package com.shortdrama.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shortdrama.dto.request.CreateCharacterRequest;
import com.shortdrama.dto.request.UpdateCharacterRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class CharacterApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testCreateAndGetCharacter() throws Exception {
        // First create a novel
        String novelId = createTestNovel();

        // Create character
        CreateCharacterRequest request = new CreateCharacterRequest();
        request.setName("Test Character");
        request.setDescription("A test character description");
        request.setNovelId(novelId);

        MvcResult createResult = mockMvc.perform(post("/api/novels/" + novelId + "/characters")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Test Character"))
                .andReturn();

        String characterId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // Get character
        mockMvc.perform(get("/api/novels/" + novelId + "/characters/" + characterId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Test Character"));
    }

    @Test
    void testGetAllCharacters() throws Exception {
        String novelId = createTestNovel();

        mockMvc.perform(get("/api/novels/" + novelId + "/characters"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void testUpdateCharacter() throws Exception {
        String novelId = createTestNovel();
        String characterId = createTestCharacter(novelId);

        UpdateCharacterRequest updateRequest = new UpdateCharacterRequest();
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
    void testConfirmCharacter() throws Exception {
        String novelId = createTestNovel();
        String characterId = createTestCharacter(novelId);

        mockMvc.perform(put("/api/novels/" + novelId + "/characters/" + characterId + "/confirm"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("confirmed"));
    }

    private String createTestNovel() throws Exception {
        com.shortdrama.dto.request.CreateNovelRequest request = new com.shortdrama.dto.request.CreateNovelRequest();
        request.setTitle("Test Novel for Character");
        request.setAuthor("Test Author");

        MvcResult result = mockMvc.perform(post("/api/novels")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("id").asText();
    }

    private String createTestCharacter(String novelId) throws Exception {
        CreateCharacterRequest request = new CreateCharacterRequest();
        request.setName("Test Character");
        request.setDescription("Test description");
        request.setNovelId(novelId);

        MvcResult result = mockMvc.perform(post("/api/novels/" + novelId + "/characters")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("id").asText();
    }
}
