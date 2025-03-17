package com.sazhnov.performance.openVTS.redis;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.ListOperations;
import java.util.*;

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

    public void createTable(String tableName, List<String> columns) {
        deleteTable(tableName);
        String metadataKey = "table:" + tableName + ":metadata";
        hashOperations.put(metadataKey, "columns", serialize(columns));
        setOperations.add(TABLE_LIST_KEY, tableName);
    }

    public void deleteTable(String tableName) {
        String metadataKey = "table:" + tableName + ":metadata";
        String rowsKey = "table:" + tableName + ":rows";
        redisTemplate.delete(metadataKey);
        redisTemplate.delete(rowsKey);
        setOperations.remove(TABLE_LIST_KEY, tableName);
    }

    public void addRow(String tableName, List<Object> values) {
        String rowsKey = "table:" + tableName + ":rows";
        listOperations.rightPush(rowsKey, serialize(values));
    }

    public List<Object> getRandomRow(String tableName) {
        String rowsKey = "table:" + tableName + ":rows";
        Long size = listOperations.size(rowsKey);
        if (size == null || size == 0) return null;

        int randomIndex = new Random().nextInt(size.intValue());
        String json = listOperations.index(rowsKey, randomIndex);
        return deserialize(json);
    }

    public List<Object> popRow(String tableName) {
        String rowsKey = "table:" + tableName + ":rows";
        String json = listOperations.rightPop(rowsKey);
        return deserialize(json);
    }

    public Map<String, Integer> getTablesWithRowCounts() {
        Set<String> tableNames = setOperations.members(TABLE_LIST_KEY);
        if (tableNames == null) return Collections.emptyMap();

        Map<String, Integer> tableCounts = new HashMap<>();
        for (String tableName : tableNames) {
            String rowsKey = "table:" + tableName + ":rows";
            Long rowCount = listOperations.size(rowsKey);
            tableCounts.put(tableName, rowCount != null ? rowCount.intValue() : 0);
        }
        return tableCounts;
    }

    private String serialize(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new RuntimeException("Error serializing object", e);
        }
    }

    private List<Object> deserialize(String json) {
        if (json == null) return null;
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (Exception e) {
            throw new RuntimeException("Error deserializing JSON to List", e);
        }
    }
}