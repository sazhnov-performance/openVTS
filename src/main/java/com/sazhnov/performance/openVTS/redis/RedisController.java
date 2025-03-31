package com.sazhnov.performance.openVTS.redis;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.*;

@RestController
@RequestMapping("/api/v1")
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

    @PostMapping("/table/row/add")
    public ResponseEntity<Map<String, String>> addRow(@RequestParam String tableName, @RequestBody List<Object> values) {
        redisService.addRow(tableName, values);
        return ResponseEntity.ok(Collections.singletonMap("message", "Row added to " + tableName));
    }

    @GetMapping("/table/row/read")
    public ResponseEntity<Map<String, Object>> getRandomRow(@RequestParam String tableName) {
        List<Object> columns = redisService.getColumns(tableName);
        List<Object> row = redisService.getRandomRow(tableName);

        if (columns == null || row == null) {
            return ResponseEntity.ok(Collections.singletonMap("message", "No data found."));
        }

        Map<String, Object> response = new HashMap<>();
        for (int i = 0; i < columns.size() && i < row.size(); i++) {
            response.put(columns.get(i).toString(), row.get(i));
        }
        return ResponseEntity.ok(response);
    }


    @GetMapping("/table/columns/get")
    public ResponseEntity<Map<String, Object>> getColumns(@RequestParam String tableName) {
        List<Object> row = redisService.getColumns(tableName);
        if (row == null) {
            return ResponseEntity.ok(Collections.singletonMap("message", "No data found."));
        }
        return ResponseEntity.ok(Collections.singletonMap("data", row));
    }

    @GetMapping("/table/row/extract")
    public ResponseEntity<Map<String, Object>> getLatestRowWithColumns(@RequestParam String tableName) {
        List<Object> columns = redisService.getColumns(tableName);
        List<Object> row = redisService.popRow(tableName);

        if (columns == null || row == null) {
            return ResponseEntity.ok(Collections.singletonMap("message", "No data found."));
        }

        Map<String, Object> response = new HashMap<>();
        for (int i = 0; i < columns.size() && i < row.size(); i++) {
            response.put(columns.get(i).toString(), row.get(i));
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/table/summary")
    public ResponseEntity<Map<String, Object>> getTablesWithRowCountsAndColumns() {
        Map<String, Integer> rowCounts = redisService.getTablesWithRowCounts();

        List<Map<String, Object>> tableSummaries = new ArrayList<>();

        for (Map.Entry<String, Integer> entry : rowCounts.entrySet()) {
            String tableName = entry.getKey();
            Integer rowCount = entry.getValue();
            List<Object> columns = redisService.getColumns(tableName);

            Map<String, Object> tableInfo = new HashMap<>();
            tableInfo.put("table", tableName);
            tableInfo.put("rowCount", rowCount);
            tableInfo.put("columns", columns);

            tableSummaries.add(tableInfo);
        }

        return ResponseEntity.ok(Collections.singletonMap("tables", tableSummaries));
    }


    @GetMapping("/table/row/paginate")
    public ResponseEntity<List<Map<String, Object>>> getRowsWithPagination(@RequestParam String tableName, @RequestParam int page, @RequestParam int size) {
        List<Object> columns = redisService.getColumns(tableName);
        List<List<Object>> rows = redisService.getRowsWithPagination(tableName, page, size);

        if (columns == null || rows.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<Map<String, Object>> responseList = new ArrayList<>();
        for (List<Object> row : rows) {
            Map<String, Object> rowMap = new HashMap<>();
            for (int i = 0; i < columns.size() && i < row.size(); i++) {
                rowMap.put(columns.get(i).toString(), row.get(i));
            }
            responseList.add(rowMap);
        }

        return ResponseEntity.ok(responseList);
    }

    @PostMapping("/table/upload")
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

    @GetMapping("/table/row/cycle")
    public ResponseEntity<Map<String, Object>> cycleRow(@RequestParam String tableName) {
        List<Object> columns = redisService.getColumns(tableName);
        List<Object> row = redisService.cycleRow(tableName);

        if (columns == null || row == null) {
            return ResponseEntity.ok(Collections.singletonMap("message", "No data found."));
        }

        Map<String, Object> response = new HashMap<>();
        for (int i = 0; i < columns.size() && i < row.size(); i++) {
            response.put(columns.get(i).toString(), row.get(i));
        }
        return ResponseEntity.ok(response);
    }

}
