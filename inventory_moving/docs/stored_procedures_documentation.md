# Stored Procedures Documentation
## Inventory Management System - XAMPP 8.2.4-0 Compatible

### Overview
This document provides comprehensive documentation for all stored procedures in the inventory management system, designed to be compatible with XAMPP 8.2.4-0 (MariaDB 10.4.28).

---

## 1. GetStockMovementSummary

### Purpose
Retrieves stock movement summary for a specified date range, showing total in, total out, and net movement for each item.

### Syntax
```sql
CALL GetStockMovementSummary(start_date, end_date);
```

### Parameters
- `start_date` (DATE): Start date for the analysis period
- `end_date` (DATE): End date for the analysis period

### Returns
- `item_name`: Name of the item
- `item_code`: Unique code of the item
- `category`: Item category (Gudang Kain, Gudang Dus, Gudang Tali)
- `total_in`: Total quantity received during the period
- `total_out`: Total quantity issued during the period
- `net_movement`: Net movement (total_in - total_out)

### Example Usage
```sql
-- Get stock movement for January 2024
CALL GetStockMovementSummary('2024-01-01', '2024-01-31');

-- Get stock movement for last 3 months
CALL GetStockMovementSummary(DATE_SUB(CURDATE(), INTERVAL 3 MONTH), CURDATE());
```

---

## 2. GetReorderAlerts

### Purpose
Identifies items that need reordering based on current stock levels compared to minimum stock requirements.

### Syntax
```sql
CALL GetReorderAlerts();
```

### Parameters
None

### Returns
- `name`: Item name
- `code`: Item code
- `category`: Item category
- `min_stock`: Minimum stock level
- `current_stock`: Current stock level
- `shortage_qty`: Quantity short of minimum stock
- `shortage_value`: Monetary value of the shortage

### Example Usage
```sql
-- Get all items that need reordering
CALL GetReorderAlerts();
```

---

## 3. GetFastMovingItems

### Purpose
Identifies items with high turnover ratio (fast moving inventory).

### Syntax
```sql
CALL GetFastMovingItems();
```

### Parameters
None

### Returns
- `name`: Item name
- `code`: Item code
- `category`: Item category
- `turnover_ratio`: Turnover ratio (higher = faster moving)
- `current_stock`: Current stock level

### Example Usage
```sql
-- Get fast moving items
CALL GetFastMovingItems();
```

---

## 4. GetSlowMovingItems

### Purpose
Identifies items with moderate turnover ratio (slow moving inventory).

### Syntax
```sql
CALL GetSlowMovingItems();
```

### Parameters
None

### Returns
- `name`: Item name
- `code`: Item code
- `category`: Item category
- `turnover_ratio`: Turnover ratio
- `current_stock`: Current stock level

### Example Usage
```sql
-- Get slow moving items
CALL GetSlowMovingItems();
```

---

## 5. GetDeadStockItems

### Purpose
Identifies items with very low or no movement (dead stock).

### Syntax
```sql
CALL GetDeadStockItems();
```

### Parameters
None

### Returns
- `name`: Item name
- `code`: Item code
- `category`: Item category
- `turnover_ratio`: Turnover ratio (very low for dead stock)
- `current_stock`: Current stock level
- `last_out_date`: Date of last outgoing transaction

### Example Usage
```sql
-- Get dead stock items
CALL GetDeadStockItems();
```

---

## 6. GetStockValueSummary

### Purpose
Provides summary of stock value by category.

### Syntax
```sql
CALL GetStockValueSummary();
```

### Parameters
None

### Returns
- `category`: Item category
- `item_count`: Number of items in category
- `total_value`: Total value of stock in category
- `avg_item_value`: Average value per item in category

### Example Usage
```sql
-- Get stock value summary by category
CALL GetStockValueSummary();
```

---

## 7. GetStockMovementByCategory

### Purpose
Analyzes stock movement by category for a specified date range.

### Syntax
```sql
CALL GetStockMovementByCategory(start_date, end_date);
```

### Parameters
- `start_date` (DATE): Start date for the analysis period
- `end_date` (DATE): End date for the analysis period

### Returns
- `category`: Item category
- `item_count`: Number of items in category
- `total_in`: Total quantity received in category
- `total_out`: Total quantity issued in category
- `net_movement`: Net movement for category

### Example Usage
```sql
-- Get stock movement by category for Q1 2024
CALL GetStockMovementByCategory('2024-01-01', '2024-03-31');
```

---

## 8. GetLowStockByCategory

### Purpose
Identifies low stock situations grouped by category.

### Syntax
```sql
CALL GetLowStockByCategory();
```

### Parameters
None

### Returns
- `category`: Item category
- `low_stock_count`: Number of items with low stock in category
- `total_shortage`: Total quantity shortage in category
- `shortage_value`: Total monetary value of shortage in category

### Example Usage
```sql
-- Get low stock summary by category
CALL GetLowStockByCategory();
```

---

## Views Used by Procedures

### v_current_stock
Provides current stock levels for all items with stock status indicators.

### v_stock_analysis
Provides stock analysis including turnover ratios and movement categories.

---

## Error Handling

All procedures include basic error handling:
- Parameter validation for date ranges
- NULL value handling with COALESCE
- Proper JOIN handling to avoid missing data

---

## Performance Considerations

- All procedures use indexed columns for optimal performance
- Views are pre-calculated to avoid repeated complex calculations
- Procedures are designed to work efficiently with the existing index structure

---

## Compatibility Notes

- Compatible with XAMPP 8.2.4-0 (MariaDB 10.4.28)
- No DELIMITER statements required
- Uses standard SQL syntax compatible with MariaDB
- Triggers are separated into a separate migration file for better compatibility

---

## Testing Queries

```sql
-- Test all procedures
CALL GetStockMovementSummary('2024-01-01', '2024-03-31');
CALL GetReorderAlerts();
CALL GetFastMovingItems();
CALL GetSlowMovingItems();
CALL GetDeadStockItems();
CALL GetStockValueSummary();
CALL GetStockMovementByCategory('2024-01-01', '2024-03-31');
CALL GetLowStockByCategory();
```

---

## Maintenance

- Procedures should be reviewed quarterly for performance optimization
- Monitor execution times for large datasets
- Consider adding additional indexes if performance degrades
- Backup procedures before any modifications 