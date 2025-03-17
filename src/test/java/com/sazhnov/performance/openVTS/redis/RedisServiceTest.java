package com.sazhnov.performance.openVTS.redis;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.connection.RedisConnectionFactory;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
@SpringBootTest
class RedisServiceTest {

    private static final Logger logger = LoggerFactory.getLogger(RedisServiceTest.class);

    @Autowired
    private RedisConnectionFactory redisConnectionFactory; // Use Spring Boot's managed RedisConnectionFactory

    private RedisService redisService;

    @BeforeEach
    void setUp() {
        try {
            // Pass the correctly injected RedisConnectionFactory to RedisService
            redisService = new RedisService(redisConnectionFactory);
        } catch (Exception e) {
            logger.error("Error initializing RedisService", e);
            throw new RuntimeException("Failed to initialize RedisService", e);
        }
    }

    @Test
    void testCreateTable() {
        String tableName = "users";
        try {
            redisService.createTable(tableName, List.of("id", "name"));
            assertThat(redisService.getTablesWithRowCounts()).containsKey("users");
        } catch (Exception e) {
            logger.error("Error occurred while creating table: {}", tableName, e);
            throw new RuntimeException("Test failed due to exception", e);
        }
    }
}
