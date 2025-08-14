-- ============================================
-- Simple SQL Queries for Stock Analysis
-- Compatible with XAMPP 8.2.4-0
-- ============================================

USE inventory_moving;

-- ============================================
-- Query 1: Stock Movement Summary
-- Usage: Replace '2024-01-01' and '2024-03-31' with your date range
-- ============================================
/*
SELECT 
    i.name as item_name,
    i.code as item_code,
    i.category,
    IFNULL(SUM(CASE WHEN t.type = 'in' THEN t.quantity ELSE 0 END), 0) as total_in,
    IFNULL(SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) as total_out,
    IFNULL(SUM(CASE WHEN t.type = 'in' THEN t.quantity ELSE 0 END), 0) - 
    IFNULL(SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) as net_movement
FROM items i
LEFT JOIN transactions t ON i.id = t.item_id 
    AND t.date BETWEEN '2024-01-01' AND '2024-03-31'
GROUP BY i.id, i.name, i.code, i.category
ORDER BY net_movement DESC;
*/

-- ============================================
-- Query 2: Reorder Alerts
-- ============================================
/*
SELECT 
    i.name,
    i.code,
    i.category,
    i.min_stock,
    v.current_stock,
    i.min_stock - v.current_stock as shortage_qty,
    (i.min_stock - v.current_stock) * i.price as shortage_value
FROM items i
JOIN v_current_stock v ON i.id = v.id
WHERE v.current_stock <= i.min_stock
ORDER BY shortage_qty DESC;
*/

-- ============================================
-- Query 3: Fast Moving Items
-- ============================================
/*
SELECT 
    i.name,
    i.code,
    i.category,
    v.turnover_ratio,
    v.current_stock
FROM items i
JOIN v_stock_analysis v ON i.id = v.id
WHERE v.movement_category = 'FAST_MOVING'
ORDER BY v.turnover_ratio DESC;
*/

-- ============================================
-- Query 4: Slow Moving Items
-- ============================================
/*
SELECT 
    i.name,
    i.code,
    i.category,
    v.turnover_ratio,
    v.current_stock
FROM items i
JOIN v_stock_analysis v ON i.id = v.id
WHERE v.movement_category = 'SLOW_MOVING'
ORDER BY v.turnover_ratio DESC;
*/

-- ============================================
-- Query 5: Dead Stock Items
-- ============================================
/*
SELECT 
    i.name,
    i.code,
    i.category,
    v.turnover_ratio,
    v.current_stock,
    v.last_out_date
FROM items i
JOIN v_stock_analysis v ON i.id = v.id
WHERE v.movement_category = 'DEAD_STOCK'
ORDER BY v.last_out_date ASC;
*/

-- ============================================
-- Query 6: Stock Value Summary by Category
-- ============================================
/*
SELECT 
    i.category,
    COUNT(i.id) as item_count,
    SUM(v.current_stock * i.price) as total_value,
    AVG(v.current_stock * i.price) as avg_item_value
FROM items i
JOIN v_current_stock v ON i.id = v.id
GROUP BY i.category
ORDER BY total_value DESC;
*/

-- ============================================
-- Query 7: Stock Movement by Category
-- Usage: Replace '2024-01-01' and '2024-03-31' with your date range
-- ============================================
/*
SELECT 
    i.category,
    COUNT(DISTINCT i.id) as item_count,
    IFNULL(SUM(CASE WHEN t.type = 'in' THEN t.quantity ELSE 0 END), 0) as total_in,
    IFNULL(SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) as total_out,
    IFNULL(SUM(CASE WHEN t.type = 'in' THEN t.quantity ELSE 0 END), 0) - 
    IFNULL(SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) as net_movement
FROM items i
LEFT JOIN transactions t ON i.id = t.item_id 
    AND t.date BETWEEN '2024-01-01' AND '2024-03-31'
GROUP BY i.category
ORDER BY net_movement DESC;
*/

-- ============================================
-- Query 8: Low Stock by Category
-- ============================================
/*
SELECT 
    i.category,
    COUNT(i.id) as low_stock_count,
    SUM(i.min_stock - v.current_stock) as total_shortage,
    SUM((i.min_stock - v.current_stock) * i.price) as shortage_value
FROM items i
JOIN v_current_stock v ON i.id = v.id
WHERE v.current_stock <= i.min_stock
GROUP BY i.category
ORDER BY shortage_value DESC;
*/

-- ============================================
-- Query 9: Current Stock Levels
-- ============================================
/*
SELECT 
    i.name,
    i.code,
    i.category,
    v.current_stock,
    i.min_stock,
    v.stock_status
FROM items i
JOIN v_current_stock v ON i.id = v.id
ORDER BY v.current_stock DESC;
*/

-- ============================================
-- Query 10: Recent Transactions
-- ============================================
/*
SELECT 
    t.date,
    i.name as item_name,
    i.code as item_code,
    t.type,
    t.quantity,
    t.supplier,
    t.recipient,
    t.notes
FROM transactions t
JOIN items i ON t.item_id = i.id
ORDER BY t.date DESC, t.created_at DESC
LIMIT 20;
*/

-- ============================================
-- Query 11: Stock Analysis Summary
-- ============================================
/*
SELECT 
    v.movement_category,
    COUNT(*) as item_count,
    AVG(v.turnover_ratio) as avg_turnover,
    SUM(v.current_stock) as total_stock
FROM v_stock_analysis v
GROUP BY v.movement_category
ORDER BY item_count DESC;
*/

-- ============================================
-- Query 12: Items by Category
-- ============================================
/*
SELECT 
    category,
    COUNT(*) as item_count,
    SUM(price) as total_value
FROM items
GROUP BY category
ORDER BY item_count DESC;
*/

-- ============================================
-- Usage Instructions
-- ============================================

/*
HOW TO USE THESE QUERIES:

1. Copy any query you want to use
2. Remove the comment markers (/* and */)
3. For date-based queries, replace the dates with your desired range
4. Paste into phpMyAdmin SQL tab and execute

EXAMPLE USAGE:

-- For stock movement in January 2024:
-- Copy Query 1 and replace dates:
SELECT 
    i.name as item_name,
    i.code as item_code,
    i.category,
    IFNULL(SUM(CASE WHEN t.type = 'in' THEN t.quantity ELSE 0 END), 0) as total_in,
    IFNULL(SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) as total_out,
    IFNULL(SUM(CASE WHEN t.type = 'in' THEN t.quantity ELSE 0 END), 0) - 
    IFNULL(SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) as net_movement
FROM items i
LEFT JOIN transactions t ON i.id = t.item_id 
    AND t.date BETWEEN '2024-01-01' AND '2024-01-31'
GROUP BY i.id, i.name, i.code, i.category
ORDER BY net_movement DESC;
*/

-- ============================================
-- End of Simple Queries
-- ============================================ 