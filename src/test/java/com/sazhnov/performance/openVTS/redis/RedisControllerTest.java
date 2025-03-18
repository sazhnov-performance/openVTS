package com.sazhnov.performance.openVTS.redis;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;

import java.util.*;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("test")
@ExtendWith(SpringExtension.class)
@WebMvcTest(RedisController.class)
class RedisControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RedisService redisService;  // Inject manually created mock

    @TestConfiguration
    static class TestConfig {
        @Bean
        public RedisService redisService() {
            return Mockito.mock(RedisService.class);
        }
    }

    @BeforeEach
    void setup() {
        Mockito.reset(redisService); // Reset mock state before each test
    }

    @Test
    void testCreateTable() throws Exception {
        mockMvc.perform(post("/api/v1/table/create")
                        .param("tableName", "testTable")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[\"column1\", \"column2\"]"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Table testTable created."));
    }

    @Test
    void testDeleteTable() throws Exception {
        mockMvc.perform(delete("/api/v1/table/delete")
                        .param("tableName", "testTable"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Table testTable deleted."));
    }


    @Test
    void testUploadCsv_Success() throws Exception {
        String csvData = "name,age\nAlice,25\nBob,30";
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.csv", "text/csv", csvData.getBytes());

        mockMvc.perform(multipart("/api/v1/table/upload")
                        .file(file)
                        .param("tableName", "testTable"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Table testTable created and populated from CSV."));
    }

    @Test
    void testUploadCsv_EmptyFile() throws Exception {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file", "empty.csv", "text/csv", new byte[0]);

        mockMvc.perform(multipart("/api/v1/table/upload")
                        .file(emptyFile)
                        .param("tableName", "testTable"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("File is empty"));
    }
}
