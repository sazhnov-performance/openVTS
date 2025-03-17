package com.sazhnov.performance.openVTS.redis;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.*;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
@SpringBootTest
class RedisServiceTest {

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private HashOperations<String, String, List<String>> hashOperations;

    @Mock
    private SetOperations<String, Object> setOperations;

    @Mock
    private ListOperations<String, Object> listOperations;

    @InjectMocks
    private RedisService redisService;

    @BeforeEach
    void setUp() {
        Mockito.<HashOperations<String, String, List<String>>>when(redisTemplate.opsForHash()).thenReturn(hashOperations);
        Mockito.when(redisTemplate.opsForSet()).thenReturn(setOperations);
        Mockito.when(redisTemplate.opsForList()).thenReturn(listOperations);
    }

    @Test
    void testCreateTable() {
        String tableName = "users";
        List<String> columns = List.of("id", "name");

        redisService.createTable(tableName, columns);

        verify(hashOperations).put(eq(tableName), eq("columns"), eq(columns));
        verify(setOperations).add(eq("redis_tables"), eq(tableName));
    }

    @Test
    void testDeleteTable() {
        String tableName = "users";

        redisService.deleteTable(tableName);

        verify(redisTemplate).delete(eq(tableName));
        verify(setOperations).remove(eq("redis_tables"), eq(tableName));
    }

    @Test
    void testAddRow() {
        String tableName = "users";
        List<Object> values = List.of(1, "Alice");

        redisService.addRow(tableName, values);

        verify(listOperations).rightPush(eq(tableName), eq(values));
    }

    @Test
    void testGetRandomRow() {
        String tableName = "users";
        when(listOperations.size(tableName)).thenReturn(3L);
        when(listOperations.index(eq(tableName), anyInt())).thenReturn(List.of("Alice", 25));

        List<Object> randomRow = redisService.getRandomRow(tableName);

        assertThat(randomRow).containsExactly("Alice", 25);
    }

    @Test
    void testGetRandomRow_EmptyTable() {
        String tableName = "users";
        when(listOperations.size(tableName)).thenReturn(0L);

        List<Object> randomRow = redisService.getRandomRow(tableName);

        assertThat(randomRow).isNull();
    }

    @Test
    void testGetLatestRowAndDelete() {
        String tableName = "users";
        List<Object> latestRow = List.of("Bob", 30);
        when(listOperations.rightPop(tableName)).thenReturn(latestRow);

        List<Object> result = redisService.getLatestRowAndDelete(tableName);

        assertThat(result).containsExactly("Bob", 30);
    }

    @Test
    void testGetTablesWithRowCounts() {
        Set<Object> mockTables = new HashSet<>(Set.of("users", "orders"));
        when(setOperations.members("redis_tables")).thenReturn(mockTables);
        when(listOperations.size("users")).thenReturn(5L);
        when(listOperations.size("orders")).thenReturn(10L);

        Map<String, Integer> result = redisService.getTablesWithRowCounts();

        assertThat(result).hasSize(2);
        assertThat(result.get("users")).isEqualTo(5);
        assertThat(result.get("orders")).isEqualTo(10);
    }

    @Test
    void testGetTablesWithRowCounts_NoTables() {
        when(setOperations.members("redis_tables")).thenReturn(null);

        Map<String, Integer> result = redisService.getTablesWithRowCounts();

        assertThat(result).isEmpty();
    }
}
