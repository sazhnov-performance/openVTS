package com.sazhnov.performance.openVTS.redis;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles("test")
@ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
@SpringBootTest
class RedisServiceTest {

    private static final Logger logger = LoggerFactory.getLogger(RedisServiceTest.class);

    @Autowired
    private RedisConnectionFactory redisConnectionFactory;

    private RedisService redisService;

    @BeforeEach
    void setUp() {
        try {
            redisService = new RedisService(redisConnectionFactory);

        } catch (Exception e) {
            logger.error("Error initializing RedisService", e);
            throw new RuntimeException("Failed to initialize RedisService", e);
        }
    }

    @Test
    void testCreateTable() {
        String tableName = "users";
        redisService.createTable(tableName, List.of("id", "name"));
        assertThat(redisService.getTablesWithRowCounts()).containsKey(tableName);
    }

    @Test
    void testDeleteTable() {
        String tableName = "users";
        redisService.createTable(tableName, List.of("id", "name"));
        redisService.deleteTable(tableName);
        redisService.deleteTable("orders");
        assertThat(redisService.getTablesWithRowCounts()).doesNotContainKey(tableName);
    }

    @Test
    void testAddRowAndGetRandomRow() {
        String tableName = "users";
        redisService.createTable(tableName, List.of("id", "name"));
        List<Object> row = List.of(1, "John Doe");
        redisService.addRow(tableName, row);
        assertThat(redisService.getRandomRow(tableName)).isEqualTo(row);
    }

    @Test
    void testPopRow() {
        String tableName = "users";
        redisService.createTable(tableName, List.of("id", "name"));
        List<Object> row1 = List.of(1, "John Doe");
        List<Object> row2 = List.of(2, "Jane Doe");
        redisService.addRow(tableName, row1);
        redisService.addRow(tableName, row2);
        assertThat(redisService.popRow(tableName)).isEqualTo(row2);
        assertThat(redisService.popRow(tableName)).isEqualTo(row1);
    }

    @Test
    void testGetTablesWithRowCounts() {
        String table1 = "users";
        String table2 = "orders";
        redisService.createTable(table1, List.of("id", "name"));
        redisService.createTable(table2, List.of("order_id", "amount"));
        redisService.addRow(table1, List.of(1, "Alice"));
        redisService.addRow(table1, List.of(2, "Bob"));
        redisService.addRow(table2, List.of(101, 250.0));

        Map<String, Integer> tableCounts = redisService.getTablesWithRowCounts();
        assertThat(tableCounts).containsEntry(table1, 2);
        assertThat(tableCounts).containsEntry(table2, 1);
    }

    @Test
    void testGetRowsWithPagination() {
        String tableName = "users";
        redisService.createTable(tableName, List.of("id", "name"));
        redisService.addRow(tableName, List.of(1, "Alice"));
        redisService.addRow(tableName, List.of(2, "Bob"));
        redisService.addRow(tableName, List.of(3, "Charlie"));
        redisService.addRow(tableName, List.of(4, "David"));

        List<List<Object>> page1 = redisService.getRowsWithPagination(tableName, 1, 2);
        List<List<Object>> page2 = redisService.getRowsWithPagination(tableName, 2, 2);

        assertThat(page1).hasSize(2);
        assertThat(page1.get(0)).containsExactly(1, "Alice");
        assertThat(page1.get(1)).containsExactly(2, "Bob");

        assertThat(page2).hasSize(2);
        assertThat(page2.get(0)).containsExactly(3, "Charlie");
        assertThat(page2.get(1)).containsExactly(4, "David");
    }
}