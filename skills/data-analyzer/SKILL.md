---
name: data-analyzer
description: Analyze and query multiple file formats including JSON, CSV, and Nginx logs using SQL statements for data analysis and reporting.
---

# Data Analyzer Skill

## Overview

This skill enables SQL-based data analysis on various file formats without requiring a database. It's perfect for quick data exploration, log analysis, and reporting tasks.

## Supported File Formats

### JSON (.json)
Supports three JSON formats:

1. **JSON object containing data array**
```json
{
  "code": "success",
  "data": [
    {"id": 1, "name": "Project 1", "type": "PROJECT"},
    {"id": 2, "name": "Project 2", "type": "PROJECT"}
  ]
}
```

2. **Direct JSON array**
```json
[
  {"id": 1, "name": "Project 1", "type": "PROJECT"},
  {"id": 2, "name": "Project 2", "type": "PROJECT"}
]
```

3. **Single JSON object**
```json
{"id": 1, "name": "Project 1", "type": "PROJECT"}
```

### CSV (.csv, .tsv)
Supports standard CSV/TSV files with automatic delimiter detection and type inference:
```csv
id,name,age,department,salary
1,Alice,28,Engineering,95000
2,Bob,32,Marketing,87000
3,Charlie,25,Engineering,82000
```

### Nginx Log (.log, .access.log)
Supports Nginx Combined format with automatic field parsing:
```
127.0.0.1 - - [10/Oct/2023:13:55:36 +0000] "GET /api/test HTTP/1.1" 200 1234 "-" "Mozilla/5.0"
192.168.1.100 - - [10/Oct/2023:13:55:37 +0000] "POST /api/login HTTP/1.1" 200 567 "http://example.com" "curl/7.68.0"
```

Parsed fields:
- `remote_addr` - Client IP address
- `time_local` - Access time (converted to ISO format)
- `request` / `method` / `path` / `protocol` - Request details
- `status` - HTTP status code (integer)
- `body_bytes_sent` - Response bytes sent (integer)
- `http_referer` - Referrer page
- `http_user_agent` - User agent

## Usage Patterns

### Basic Data Exploration

**Count total records:**
```sql
SELECT COUNT(*) FROM table_name;
```

**View sample data:**
```sql
SELECT * FROM table_name LIMIT 10;
```

**Get distinct values:**
```sql
SELECT DISTINCT column_name FROM table_name;
```

### Filtering and Selection

**Filter by condition:**
```sql
SELECT * FROM table_name WHERE status = 'success';
```

**Multiple conditions:**
```sql
SELECT * FROM table_name WHERE age > 25 AND department = 'Engineering';
```

**Pattern matching:**
```sql
SELECT * FROM table_name WHERE name LIKE '%Project%';
```

### Aggregation and Grouping

**Group by category:**
```sql
SELECT type, COUNT(*) as count FROM table_name GROUP BY type;
```

**Calculate statistics:**
```sql
SELECT department, AVG(salary) as avg_salary, MAX(salary) as max_salary, MIN(salary) as min_salary 
FROM table_name 
GROUP BY department;
```

**Multiple aggregations:**
```sql
SELECT status, COUNT(*) as count, AVG(body_bytes_sent) as avg_bytes 
FROM table_name 
GROUP BY status 
ORDER BY count DESC;
```

### Sorting and Limiting

**Top N records:**
```sql
SELECT * FROM table_name ORDER BY salary DESC LIMIT 10;
```

**Sort by multiple columns:**
```sql
SELECT * FROM table_name ORDER BY department ASC, salary DESC;
```

### Nginx Log Analysis

**Status code distribution:**
```sql
SELECT status, COUNT(*) as count FROM table_name GROUP BY status ORDER BY count DESC;
```

**Find errors (4xx/5xx):**
```sql
SELECT * FROM table_name WHERE status >= 400;
```

**Top IPs by request count:**
```sql
SELECT remote_addr, COUNT(*) as request_count 
FROM table_name 
GROUP BY remote_addr 
ORDER BY request_count DESC 
LIMIT 10;
```

**Request count by path:**
```sql
SELECT path, COUNT(*) as request_count 
FROM table_name 
GROUP BY path 
ORDER BY request_count DESC 
LIMIT 20;
```

**Find slow responses (large body size):**
```sql
SELECT path, status, body_bytes_sent 
FROM table_name 
WHERE body_bytes_sent > 10000 
ORDER BY body_bytes_sent DESC;
```

**Time-based analysis:**
```sql
SELECT DATE(time_local) as date, COUNT(*) as request_count 
FROM table_name 
GROUP BY DATE(time_local) 
ORDER BY date DESC;
```

## Best Practices

### Performance Considerations
- Large files consume significant memory as the tool loads entire file into memory
- Use LIMIT clause when exploring data to avoid processing all records
- Index columns are not available (in-memory database)
- Consider filtering early in WHERE clause before aggregation

### Data Type Handling
- Column types are inferred from the first data item
- Subsequent different types may cause conversion issues
- Use CAST() for explicit type conversion when needed
- Check data types with: `PRAGMA table_info(table_name);`

### Query Optimization
- Use specific column names instead of SELECT * when possible
- Apply WHERE filters before GROUP BY for better performance
- Use appropriate aggregation functions (COUNT, SUM, AVG, MAX, MIN)
- Consider using subqueries for complex analyses

## Common Use Cases

### 1. Log Analysis
- Identify error patterns and rates
- Analyze traffic patterns by time
- Find top users/clients
- Monitor response times

### 2. Data Quality Checks
- Find duplicates: `SELECT column, COUNT(*) FROM table GROUP BY column HAVING COUNT(*) > 1;`
- Find null values: `SELECT * FROM table WHERE column IS NULL;`
- Validate data ranges: `SELECT * FROM table WHERE age < 0 OR age > 150;`

### 3. Reporting
- Generate summary statistics
- Create pivot-like reports with GROUP BY
- Calculate percentages and ratios
- Trend analysis over time

### 4. Data Transformation
- Filter and export subsets
- Aggregate and summarize
- Join multiple datasets (if loaded into same database)
- Calculate derived columns

## Integration with AI Agents

This skill is designed to work seamlessly with AI agents. The tool supports non-interactive mode with JSON output, making it easy to parse results programmatically.

When an AI agent needs to analyze data:
1. Identify the file format and location
2. Use appropriate SQL query to extract insights
3. Interpret results and provide actionable recommendations
4. Generate visualizations or reports as needed

## Notes

1. Table names are auto-generated from filename (special characters replaced with underscores)
2. SQL features depend on SQLite implementation
3. No persistent storage - data is loaded into memory
4. Complex joins across multiple files require loading all files first
5. For very large datasets, consider using a proper database system

## Example Workflows

**Workflow 1: Quick Log Analysis**
```sql
-- Step 1: Load and explore
SELECT COUNT(*) FROM access_log;

-- Step 2: Check error rate
SELECT status, COUNT(*) FROM access_log GROUP BY status;

-- Step 3: Investigate errors
SELECT * FROM access_log WHERE status >= 400 LIMIT 20;
```

**Workflow 2: Sales Data Analysis**
```sql
-- Step 1: Overview
SELECT product, SUM(quantity) as total_sold, SUM(revenue) as total_revenue 
FROM sales 
GROUP BY product;

-- Step 2: Top performers
SELECT product, SUM(revenue) as total_revenue 
FROM sales 
GROUP BY product 
ORDER BY total_revenue DESC 
LIMIT 10;

-- Step 3: Time trends
SELECT DATE(sale_date) as date, SUM(revenue) as daily_revenue 
FROM sales 
GROUP BY DATE(sale_date) 
ORDER BY date DESC;
```

**Workflow 3: User Behavior Analysis**
```sql
-- Step 1: User activity
SELECT user_id, COUNT(*) as activity_count 
FROM events 
GROUP BY user_id 
ORDER BY activity_count DESC;

-- Step 2: Event types
SELECT event_type, COUNT(*) as count 
FROM events 
GROUP BY event_type 
ORDER BY count DESC;

-- Step 3: Funnel analysis
SELECT step, COUNT(DISTINCT user_id) as unique_users 
FROM funnel_events 
GROUP BY step 
ORDER BY step;
```