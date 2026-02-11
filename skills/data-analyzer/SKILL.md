---
name: data-analyzer
description: Analyze and query multiple file formats including JSON, CSV, and Nginx logs using SQL statements for data analysis and reporting.
---

# Data Analyzer Skill

## Overview

This skill enables SQL-based data analysis on various file formats without requiring a database. It's perfect for quick data exploration, log analysis, and reporting tasks.

## Usage

### Basic Usage

```bash
# Auto-detect format (recommended)
sqltools <file_path>

# List all supported formats
sqltools --list-formats

# Force specific format
sqltools <file_path> --format json|csv|nginx

# Custom table name
sqltools <file_path> --table <table_name>

# Execute SQL query directly (non-interactive mode, ideal for AI agents)
sqltools <file_path> --query 'SELECT COUNT(*) FROM table_name'

# Show first 3 records
sqltools <file_path> --head

# Show help
sqltools --help
```

### Non-Interactive Mode (for AI Agents)

The `--query` and `--head` options allow you to execute operations directly without entering interactive mode. This is particularly useful for AI agents and automation:

```bash
# Show first 3 records
sqltools data.json --head

# Count records
sqltools data.json --query 'SELECT COUNT(*) FROM data'

# Filter and aggregate
sqltools data.json --query 'SELECT type, COUNT(*) FROM data GROUP BY type'

# Complex queries
sqltools data.csv --query 'SELECT department, AVG(salary) as avg_salary FROM data GROUP BY department ORDER BY avg_salary DESC'
```

The output is returned as JSON, making it easy to parse programmatically.


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