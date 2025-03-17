package com.sazhnov.performance.openVTS.redis;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.connection.RedisConnectionFactory;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
@SpringBootTest
class RedisServiceTest {

    @Autowired
    private RedisConnectionFactory redisConnectionFactory; // Use Spring Boot's managed RedisConnectionFactory

    private RedisService redisService;

    @BeforeEach
    void setUp() {
        // Pass the correctly injected RedisConnectionFactory to RedisService
        redisService = new RedisService(redisConnectionFactory);
    }

    @Test
    void testCreateTable() {
        String tableName = "users";
        redisService.createTable(tableName, List.of("id", "name"));

        assertThat(redisService.getTablesWithRowCounts()).containsKey("users");
    }
}
