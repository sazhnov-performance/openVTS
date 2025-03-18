package com.sazhnov.performance.openVTS.redis;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.*;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.data.redis.core.script.DefaultRedisScript;

import java.util.*;

@SuppressWarnings("ALL")
@Getter
@Setter
@Component
public class RedisService {

    private final RedisTemplate<String, String> redisTemplate;
    private final HashOperations<String, String, String> hashOperations;
    private final SetOperations<String, String> setOperations;
    private final ListOperations<String, String> listOperations;
    private static final String TABLE_LIST_KEY = "redis_tables";
    private final ObjectMapper objectMapper;

    public RedisService(RedisConnectionFactory redisConnectionFactory) {
        this.redisTemplate = new RedisTemplate<>();
        this.redisTemplate.setConnectionFactory(redisConnectionFactory);
        this.redisTemplate.setKeySerializer(new StringRedisSerializer());
        this.redisTemplate.setValueSerializer(new StringRedisSerializer());
        this.redisTemplate.afterPropertiesSet();

        this.hashOperations = this.redisTemplate.opsForHash();
        this.setOperations = this.redisTemplate.opsForSet();
        this.listOperations = this.redisTemplate.opsForList();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Creates a new table with given columns (Thread-Safe)
     */
    public void createTable(String tableName, List<String> columns) {
        redisTemplate.execute(new SessionCallback<Void>() {
            @Override
            public Void execute(RedisOperations operations) {
                operations.multi();
                operations.delete(metadataKey(tableName));
                operations.delete(rowsKey(tableName));
                operations.opsForHash().put(metadataKey(tableName), "columns", serialize(columns));
                operations.opsForSet().add(TABLE_LIST_KEY, tableName);
                operations.exec();
                return null;
            }
        });
    }

    public void deleteTable(String tableName) {
        redisTemplate.execute(new SessionCallback<Void>() {
            @Override
            public Void execute(RedisOperations operations) {
                operations.multi();
                operations.delete(metadataKey(tableName));
                operations.delete(rowsKey(tableName));
                operations.opsForSet().remove(TABLE_LIST_KEY, tableName);
                operations.exec();
                return null;
            }
        });
    }

    /**
     * Adds a row to the table (Thread-Safe)
     */
    public void addRow(String tableName, List<Object> values) {
        listOperations.rightPush(rowsKey(tableName), serialize(values));
    }

    /**
     * Retrieves a random row atomically using Lua script (Thread-Safe)
     */
    public List<Object> getRandomRow(String tableName) {
        Long size = listOperations.size(rowsKey(tableName));
        if (size == null || size == 0) return null;

        int randomIndex = new Random().nextInt(size.intValue());

        // Lua script to fetch random row atomically
        String luaScript = "return redis.call('LINDEX', KEYS[1], ARGV[1])";
        DefaultRedisScript<String> script = new DefaultRedisScript<>(luaScript, String.class);

        String json = redisTemplate.execute(script, Collections.singletonList(rowsKey(tableName)), String.valueOf(randomIndex));
        return deserialize(json);
    }

    /**
     * Pops the last row from the table (Thread-Safe)
     */
    public List<Object> popRow(String tableName) {
        String json = listOperations.rightPop(rowsKey(tableName));
        return deserialize(json);
    }

    public List<Object> getColumns(String tableName) {
        String json = hashOperations.get(metadataKey(tableName), "columns");
        return deserialize(json);
    }

    /**
     * Retrieves table names with their row counts (Thread-Safe)
     */
    public Map<String, Integer> getTablesWithRowCounts() {
        Set<String> tableNames = setOperations.members(TABLE_LIST_KEY);
        if (tableNames == null) return Collections.emptyMap();

        Map<String, Integer> tableCounts = new HashMap<>();
        for (String tableName : tableNames) {
            Long rowCount = listOperations.size(rowsKey(tableName));
            tableCounts.put(tableName, rowCount != null ? rowCount.intValue() : 0);
        }
        return tableCounts;
    }


    /**
     * Retrieves paginated rows from the table
     */
    public List<List<Object>> getRowsWithPagination(String tableName, int pageNumber, int pageSize) {
        int start = (pageNumber - 1) * pageSize;
        int end = start + pageSize - 1;

        List<String> jsonRows = listOperations.range(rowsKey(tableName), start, end);
        if (jsonRows == null) return Collections.emptyList();

        List<List<Object>> rows = new ArrayList<>();
        for (String json : jsonRows) {
            rows.add(deserialize(json));
        }
        return rows;
    }


    private String rowsKey(String tableName){
        return "table:" + tableName + ":rows";
    }

    private String metadataKey(String tableName){
        return "table:" + tableName + ":metadata";
    }

    /**
     * Serializes an object to JSON safely
     */
    private String serialize(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new RuntimeException("Error serializing object", e);
        }
    }

    /**
     * Deserializes JSON into a List of Objects safely
     */
    private List<Object> deserialize(String json) {
        if (json == null) return null;
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            throw new RuntimeException("Error deserializing JSON to List", e);
        }
    }

    /**
     * Removes all rows from the specified table (Thread-Safe)
     */
    public void flushTable(String tableName) {
        redisTemplate.execute(new SessionCallback<Void>() {
            @Override
            public Void execute(RedisOperations operations) {
                operations.multi();
                operations.delete(rowsKey(tableName));
                operations.exec();
                return null;
            }
        });
    }

    /**
     * Pops a row from the right and pushes it to the left (cycling rows) - Thread-Safe
     * Returns the cycled row
     */
    public List<Object> cycleRow(String tableName) {
        String rowJson = redisTemplate.opsForList()
                .rightPopAndLeftPush(rowsKey(tableName), rowsKey(tableName));
        return deserialize(rowJson);
    }
}
