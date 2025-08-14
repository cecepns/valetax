# Database Setup Guide
## Inventory Management System - XAMPP 8.2.4-0

### Overview
This guide provides step-by-step instructions for setting up the inventory management database using XAMPP 8.2.4-0.

---

## Prerequisites

- XAMPP 8.2.4-0 installed on your system
- MySQL/MariaDB service running
- phpMyAdmin access (optional but recommended)

---

## Installation Steps

### 1. Start XAMPP Services

1. Open XAMPP Control Panel
2. Start Apache and MySQL services
3. Verify both services are running (green status)

### 2. Access phpMyAdmin

1. Open your web browser
2. Navigate to: `http://localhost/phpmyadmin`
3. Login with your MySQL credentials (default: root with no password)

### 3. Create Database

#### Option A: Using phpMyAdmin (Recommended)
1. Click "New" in the left sidebar
2. Enter database name: `inventory_moving`
3. Click "Create"

#### Option B: Using SQL Command
```sql
CREATE DATABASE inventory_moving;
```

### 4. Import Migration Files

#### Step 1: Import Main Schema
1. In phpMyAdmin, select the `inventory_moving` database
2. Click "Import" tab
3. Click "Choose File" and select: `supabase/migrations/20250727022857_orange_island.sql`
4. Click "Go" to execute

#### Step 2: Import Triggers (Optional)
1. Stay in the same database
2. Click "Import" tab again
3. Click "Choose File" and select: `supabase/migrations/20250727022858_triggers_xampp.sql`
4. Click "Go" to execute

---

## Database Structure

### Tables
- `users` - User authentication and roles
- `items` - Master data for inventory items
- `transactions` - All inventory movements (in/out)
- `transaction_audit` - Audit trail for transactions

### Views
- `v_current_stock` - Current stock levels with status
- `v_stock_analysis` - Stock analysis with turnover ratios

### Stored Procedures
- `GetStockMovementSummary()` - Stock movement analysis
- `GetReorderAlerts()` - Items needing reorder
- `GetFastMovingItems()` - Fast moving inventory
- `GetSlowMovingItems()` - Slow moving inventory
- `GetDeadStockItems()` - Dead stock items
- `GetStockValueSummary()` - Stock value by category
- `GetStockMovementByCategory()` - Movement by category
- `GetLowStockByCategory()` - Low stock by category

---

## Testing the Installation

### 1. Verify Tables Created
```sql
SHOW TABLES;
```

Expected output:
```
+-------------------------+
| Tables_in_inventory_moving |
+-------------------------+
| items                   |
| transaction_audit       |
| transactions            |
| users                   |
+-------------------------+
```

### 2. Verify Views Created
```sql
SHOW FULL TABLES WHERE Table_type = 'VIEW';
```

Expected output:
```
+-------------------------+------------+
| Tables_in_inventory_moving | Table_type |
+-------------------------+------------+
| v_current_stock         | VIEW       |
| v_stock_analysis        | VIEW       |
+-------------------------+------------+
```

### 3. Test Sample Data
```sql
-- Check users
SELECT * FROM users;

-- Check items
SELECT * FROM items LIMIT 5;

-- Check transactions
SELECT * FROM transactions LIMIT 5;
```

### 4. Test Stored Procedures
```sql
-- Test stock movement summary
CALL GetStockMovementSummary('2024-01-01', '2024-03-31');

-- Test reorder alerts
CALL GetReorderAlerts();

-- Test fast moving items
CALL GetFastMovingItems();
```

---

## Troubleshooting

### Common Issues

#### 1. "Column count of mysql.proc is wrong" Error
**Solution**: This is a version compatibility issue. The migration files have been updated to be compatible with XAMPP 8.2.4-0.

#### 2. "Access denied" Error
**Solution**: 
- Check if MySQL service is running
- Verify username/password in phpMyAdmin
- Default XAMPP credentials: username `root`, no password

#### 3. "DELIMITER" Error
**Solution**: The migration files have been updated to remove DELIMITER statements for better compatibility.

#### 4. "Foreign key constraint fails" Error
**Solution**: 
- Ensure you're importing files in the correct order
- Check that all tables exist before creating foreign keys

### Performance Issues

#### 1. Slow Query Execution
**Solutions**:
- Ensure indexes are created properly
- Monitor query execution times
- Consider optimizing views for large datasets

#### 2. Memory Issues
**Solutions**:
- Increase MySQL memory limits in XAMPP
- Optimize queries for large datasets
- Consider partitioning for very large tables

---

## Sample Queries for Testing

### Basic Queries
```sql
-- Get current stock levels
SELECT * FROM v_current_stock ORDER BY current_stock DESC;

-- Get items by category
SELECT category, COUNT(*) as item_count 
FROM items 
GROUP BY category;

-- Get recent transactions
SELECT t.*, i.name as item_name 
FROM transactions t 
JOIN items i ON t.item_id = i.id 
ORDER BY t.created_at DESC 
LIMIT 10;
```

### Advanced Queries
```sql
-- Get stock movement for last month
CALL GetStockMovementSummary(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), CURDATE());

-- Get items with low stock
SELECT i.name, i.code, v.current_stock, i.min_stock
FROM items i
JOIN v_current_stock v ON i.id = v.id
WHERE v.current_stock <= i.min_stock;

-- Get stock value by category
CALL GetStockValueSummary();
```

---

## Maintenance

### Regular Tasks
1. **Backup Database**: Export database regularly
2. **Monitor Performance**: Check query execution times
3. **Update Statistics**: Run `ANALYZE TABLE` periodically
4. **Clean Audit Logs**: Archive old audit records

### Backup Commands
```sql
-- Export database (using phpMyAdmin)
-- 1. Select database
-- 2. Click "Export"
-- 3. Choose "Custom" export
-- 4. Select all tables
-- 5. Choose "SQL" format
-- 6. Click "Go"
```

---

## Security Considerations

### User Management
- Change default MySQL root password
- Create specific users for application access
- Grant minimal required privileges

### Data Protection
- Regular backups
- Encrypt sensitive data
- Monitor access logs

---

## Support

For issues related to:
- **XAMPP**: Check XAMPP documentation
- **Database Schema**: Refer to migration files
- **Stored Procedures**: See `docs/stored_procedures_documentation.md`

---

## Version Information

- **XAMPP Version**: 8.2.4-0
- **MariaDB Version**: 10.4.28
- **PHP Version**: 8.2.4
- **Database Schema**: Version 1.0

---

## Changelog

### Version 1.0 (Current)
- Initial database schema
- XAMPP 8.2.4-0 compatibility
- Complete stored procedures
- Audit trail functionality
- Sample data included 