package com.sazhnov.performance.openVTS.redis;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.*;

@RestController
@RequestMapping("/api/redis")
@RequiredArgsConstructor
public class RedisController {

    private final RedisService redisService;

    @PostMapping("/table/create")
    public ResponseEntity<Map<String, String>> createTable(@RequestParam String tableName, @RequestBody List<String> columns) {
        try {
            redisService.createTable(tableName, columns);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return ResponseEntity.ok(Collections.singletonMap("message", "Table " + tableName + " created."));
    }

    @DeleteMapping("/table/delete")
    public ResponseEntity<Map<String, String>> deleteTable(@RequestParam String tableName) {
        redisService.deleteTable(tableName);
        return ResponseEntity.ok(Collections.singletonMap("message", "Table " + tableName + " deleted."));
    }

    @PostMapping("/table/addRow")
    public ResponseEntity<Map<String, String>> addRow(@RequestParam String tableName, @RequestBody List<Object> values) {
        redisService.addRow(tableName, values);
        return ResponseEntity.ok(Collections.singletonMap("message", "Row added to " + tableName));
    }

    @GetMapping("/table/getRandomRow")
    public ResponseEntity<Map<String, Object>> getRandomRow(@RequestParam String tableName) {
        List<Object> row = redisService.getRandomRow(tableName);
        if (row == null) {
            return ResponseEntity.ok(Collections.singletonMap("message", "No data found."));
        }
        return ResponseEntity.ok(Collections.singletonMap("data", row));
    }

    @GetMapping("/table/getLatestRowAndDelete")
    public ResponseEntity<Map<String, Object>> getLatestRowAndDelete(@RequestParam String tableName) {
        List<Object> row = redisService.popRow(tableName);
        if (row == null) {
            return ResponseEntity.ok(Collections.singletonMap("message", "No data found."));
        }
        return ResponseEntity.ok(Collections.singletonMap("data", row));
    }

    @GetMapping("/tables/rowCounts")
    public ResponseEntity<Map<String, Object>> getTablesWithRowCounts() {
        Map<String, Integer> rowCounts = redisService.getTablesWithRowCounts();
        return ResponseEntity.ok(Collections.singletonMap("tables", rowCounts));
    }

    @PostMapping("/table/uploadCSV")
    public ResponseEntity<Map<String, String>> uploadCsv(@RequestParam String tableName, @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "File is empty"));
            }

            // Read CSV file
            BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream()));
            List<String> lines = br.lines().toList();

            if (lines.isEmpty()) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "CSV file is empty"));
            }

            // First line is column headers
            List<String> columns = Arrays.asList(lines.getFirst().split(","));
            redisService.createTable(tableName, columns);

            // Remaining lines are data
            for (int i = 1; i < lines.size(); i++) {
                List<Object> values = Arrays.asList(lines.get(i).split(","));
                redisService.addRow(tableName, values);
            }

            return ResponseEntity.ok(Collections.singletonMap("message", "Table " + tableName + " created and populated from CSV."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Collections.singletonMap("error", "Error processing CSV file: " + e.getMessage()));
        }
    }
}
