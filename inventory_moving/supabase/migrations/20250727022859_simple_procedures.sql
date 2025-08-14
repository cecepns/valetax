-- ============================================
-- Simplified Stored Procedures for XAMPP 8.2.4-0
-- ============================================

USE inventory_moving;

-- Simple procedure to get stock movement summary
CREATE PROCEDURE GetStockMovementSummary(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
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
        AND t.date BETWEEN p_start_date AND p_end_date
    GROUP BY i.id, i.name, i.code, i.category
    ORDER BY net_movement DESC;
END;

-- Simple procedure to get reorder alerts
CREATE PROCEDURE GetReorderAlerts()
BEGIN
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
END;

-- Simple procedure to get fast moving items
CREATE PROCEDURE GetFastMovingItems()
BEGIN
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
END;

-- Simple procedure to get slow moving items
CREATE PROCEDURE GetSlowMovingItems()
BEGIN
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
END;

-- Simple procedure to get dead stock items
CREATE PROCEDURE GetDeadStockItems()
BEGIN
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
END;

-- Simple procedure to get stock value summary
CREATE PROCEDURE GetStockValueSummary()
BEGIN
    SELECT 
        i.category,
        COUNT(i.id) as item_count,
        SUM(v.current_stock * i.price) as total_value,
        AVG(v.current_stock * i.price) as avg_item_value
    FROM items i
    JOIN v_current_stock v ON i.id = v.id
    GROUP BY i.category
    ORDER BY total_value DESC;
END;

-- Simple procedure to get stock movement by category
CREATE PROCEDURE GetStockMovementByCategory(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        i.category,
        COUNT(DISTINCT i.id) as item_count,
        IFNULL(SUM(CASE WHEN t.type = 'in' THEN t.quantity ELSE 0 END), 0) as total_in,
        IFNULL(SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) as total_out,
        IFNULL(SUM(CASE WHEN t.type = 'in' THEN t.quantity ELSE 0 END), 0) - 
        IFNULL(SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) as net_movement
    FROM items i
    LEFT JOIN transactions t ON i.id = t.item_id 
        AND t.date BETWEEN p_start_date AND p_end_date
    GROUP BY i.category
    ORDER BY net_movement DESC;
END;

-- Simple procedure to get low stock by category
CREATE PROCEDURE GetLowStockByCategory()
BEGIN
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
END;

-- ============================================
-- Test Queries
-- ============================================

-- Test all procedures
-- CALL GetStockMovementSummary('2024-01-01', '2024-03-31');
-- CALL GetReorderAlerts();
-- CALL GetFastMovingItems();
-- CALL GetSlowMovingItems();
-- CALL GetDeadStockItems();
-- CALL GetStockValueSummary();
-- CALL GetStockMovementByCategory('2024-01-01', '2024-03-31');
-- CALL GetLowStockByCategory();

-- ============================================
-- End of Simplified Procedures
-- ============================================ 