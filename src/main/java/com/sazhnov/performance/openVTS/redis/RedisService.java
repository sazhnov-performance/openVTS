package com.sazhnov.performance.openVTS.redis;

import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.ListOperations;
import java.util.*;

@Getter
@Setter
@Component
public class RedisService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final HashOperations<String, String, List<String>> hashOperations;
    private final SetOperations<String, Object> setOperations;
    private final ListOperations<String, Object> listOperations;
    private static final String TABLE_LIST_KEY = "redis_tables";

    public RedisService(RedisConnectionFactory redisConnectionFactory) {
        this.redisTemplate = new RedisTemplate<>();
        this.redisTemplate.setConnectionFactory(redisConnectionFactory);
        this.redisTemplate.setKeySerializer(new StringRedisSerializer());
        this.redisTemplate.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        this.redisTemplate.afterPropertiesSet(); // Ensures proper initialization

        this.hashOperations = this.redisTemplate.opsForHash();
        this.setOperations = this.redisTemplate.opsForSet();
        this.listOperations = this.redisTemplate.opsForList();
    }

    public void createTable(String tableName, List<String> columns) {
        hashOperations.put(tableName, "columns", columns);
        setOperations.add(TABLE_LIST_KEY, tableName);
    }

    public void deleteTable(String tableName) {
        redisTemplate.delete(tableName);
        setOperations.remove(TABLE_LIST_KEY, tableName);
    }

    public void addRow(String tableName, List<Object> values) {
        listOperations.rightPush(tableName, values);
    }

    @SuppressWarnings("unchecked")
    public List<Object> getRandomRow(String tableName) {
        Long size = listOperations.size(tableName);
        if (size == null || size == 0) return null;
        int randomIndex = new Random().nextInt(size.intValue());
        return (List<Object>) listOperations.index(tableName, randomIndex);
    }

    public List<Object> getLatestRowAndDelete(String tableName) {
        return (List<Object>) listOperations.rightPop(tableName);
    }

    public Map<String, Integer> getTablesWithRowCounts() {
        Set<Object> tableNames = setOperations.members(TABLE_LIST_KEY);
        if (tableNames == null) return Collections.emptyMap();

        // Cast Object Set to String Set
        Set<String> stringTableNames = new HashSet<>();
        for (Object obj : tableNames) {
            if (obj instanceof String) {
                stringTableNames.add((String) obj);
            }
        }

        Map<String, Integer> tableCounts = new HashMap<>();
        for (String tableName : stringTableNames) {
            Long size = listOperations.size(tableName);
            tableCounts.put(tableName, size != null ? size.intValue() : 0);
        }
        return tableCounts;
    }
}
