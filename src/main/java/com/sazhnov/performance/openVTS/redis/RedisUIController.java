package com.sazhnov.performance.openVTS.redis;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.ModelAndView;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.*;


@Controller
@RequiredArgsConstructor
public class RedisUIController {

    private final RedisService redisService;

    @GetMapping("/")
    public ModelAndView getTables(Model model) {
        ModelAndView mav = new ModelAndView("tables"); // Ensure templates/tables.html exists
        mav.addObject("tables", redisService.getTablesWithRowCounts());
        return mav;
    }

    @GetMapping("/apiguide")
    public String getManual(Model model) {
        return "manual";
    }

    @GetMapping("/table/{tableName}/data")
    public String getTableData(@PathVariable String tableName, Model model) {
        List<Object> columns = redisService.getColumns(tableName);

        if (columns == null ) {
            model.addAttribute("message", "No data found for table: " + tableName);
            return "table-empty";  // Ensure table-empty.html exists
        }

        model.addAttribute("tableName", tableName);
        model.addAttribute("columns", columns);
        model.addAttribute("nextPage", 1);

        return "table-data"; // Ensure table-data.html exists
    }

    @GetMapping("/table/{tableName}/rows")
    public String getTableRows(@PathVariable String tableName, @RequestParam(defaultValue = "0") int page, Model model) {
        List<Object> columns = redisService.getColumns(tableName);
        List<List<Object>> rows = redisService.getRowsWithPagination(tableName, page, 50);

        if (columns == null || rows.isEmpty()) {
            model.addAttribute("message", "No data found for table: " + tableName);
            return "table-empty";  // Ensure table-empty.html exists
        }

        List<List<Object>> nextRows = redisService.getRowsWithPagination(tableName, page + 1, 50);
        boolean isLastPage = (nextRows == null || nextRows.isEmpty());

        model.addAttribute("tableName", tableName);
        model.addAttribute("columns", columns);
        model.addAttribute("rows", rows);
        model.addAttribute("nextPage", page + 1);
        model.addAttribute("isLastPage", isLastPage);  // Pass it to Thymeleaf


        return "table-rows"; // Ensure table-data.html exists
    }



    @PostMapping("/table/upload")
    public String uploadCsv(@RequestParam String tableName, @RequestParam("file") MultipartFile file, Model model) {
        try {
            if (file.isEmpty()) {
                model.addAttribute("error", "File is empty");
                return "upload-status";
            }

            BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream()));
            List<String> lines = br.lines().toList();

            if (lines.isEmpty()) {
                model.addAttribute("error", "CSV file is empty");
                return "upload-status";
            }

            List<String> columns = Arrays.asList(lines.getFirst().split(","));
            redisService.createTable(tableName, columns);

            for (int i = 1; i < lines.size(); i++) {
                List<Object> values = Arrays.asList(lines.get(i).split(","));
                redisService.addRow(tableName, values);
            }

            model.addAttribute("message", "Table uploaded successfully.");
            return "upload-status";

        } catch (Exception e) {
            model.addAttribute("error", "Error processing CSV file: " + e.getMessage());
            return "upload-status";
        }
    }

    @PostMapping("/table/append")
    public String appendCsv(@RequestParam String tableName, @RequestParam("file") MultipartFile file, Model model) {
        try {
            if (file.isEmpty()) {
                model.addAttribute("error", "File is empty");
                return "upload-status";
            }

            BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream()));
            List<String> lines = br.lines().toList();

            if (lines.isEmpty()) {
                model.addAttribute("error", "CSV file is empty");
                return "upload-status";
            }


            for (int i = 1; i < lines.size(); i++) {
                List<Object> values = Arrays.asList(lines.get(i).split(","));
                redisService.addRow(tableName, values);
            }

            model.addAttribute("message", "Table uploaded successfully.");
            return "append-status";

        } catch (Exception e) {
            model.addAttribute("error", "Error processing CSV file: " + e.getMessage());
            return "append-status";
        }
    }

    @PostMapping("/table/{tableName}/flush")
    public String flushTable(@PathVariable String tableName, Model model) {
        redisService.flushTable(tableName);
        model.addAttribute("message", "Table flushed successfully.");
        return "flush-status";
    }

    @PostMapping("/table/{tableName}/delete")
    public String deleteTable(@PathVariable String tableName, Model model) {
        redisService.deleteTable(tableName);
        model.addAttribute("message", "Table deleted successfully.");
        return "delete-status";
    }

}

