package com.sazhnov.performance.openVTS.redis;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.*;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
@SpringBootTest
class RedisServiceTest {


    @Autowired
    private RedisConnectionFactory redisConnectionFactory; // Use Spring's managed RedisConnectionFactory
    private RedisTemplate redisTemplate;

    private RedisService redisService;

    @BeforeEach
    void setUp() {
        redisTemplate = new RedisTemplate();
        redisTemplate.setConnectionFactory(redisConnectionFactory);
        redisService = new RedisService(redisConnectionFactory);
    }

    @Test
    void testCreateTable() {
        String tableName = "users";
        List<String> columns = List.of("id", "name");

        redisService.createTable(tableName, columns);

        ListOperations<String, Object> listOperations = redisTemplate.opsForList();
        assertThat(listOperations.size(tableName)).isNotNull();
    }

    @Test
    void testDeleteTable() {
        String tableName = "users";
        redisService.deleteTable(tableName);

        assertThat(redisTemplate.hasKey(tableName)).isFalse();
    }

    @Test
    void testAddRow() {
        String tableName = "users";
        List<Object> values = List.of(1, "Alice");

        redisService.addRow(tableName, values);

        assertThat(redisTemplate.opsForList().size(tableName)).isGreaterThan(0);
    }

    @Test
    void testGetRandomRow() {
        String tableName = "users";
        redisTemplate.opsForList().rightPush(tableName, List.of("Alice", 25));

        List<Object> randomRow = redisService.getRandomRow(tableName);

        assertThat(randomRow).isNotEmpty();
    }

    @Test
    void testGetTablesWithRowCounts() {
        redisTemplate.opsForList().rightPush("users", List.of("Alice", 25));
        redisTemplate.opsForList().rightPush("orders", List.of("Order1", 100));

        Map<String, Integer> result = redisService.getTablesWithRowCounts();

        assertThat(result).containsKeys("users", "orders");
    }
}
