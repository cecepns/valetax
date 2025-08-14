-- ============================================
-- Triggers for Audit Trail (XAMPP Compatible)
-- ============================================

USE inventory_moving;

-- Trigger for transaction updates
CREATE TRIGGER tr_transaction_audit_update
    AFTER UPDATE ON transactions
    FOR EACH ROW
BEGIN
    INSERT INTO transaction_audit (
        transaction_id, action, old_quantity, new_quantity, 
        old_type, new_type, changed_by
    ) VALUES (
        NEW.id, 'UPDATE', OLD.quantity, NEW.quantity,
        OLD.type, NEW.type, NEW.created_by
    );
END;

-- Trigger for transaction deletes
CREATE TRIGGER tr_transaction_audit_delete
    AFTER DELETE ON transactions
    FOR EACH ROW
BEGIN
    INSERT INTO transaction_audit (
        transaction_id, action, old_quantity, old_type, changed_by
    ) VALUES (
        OLD.id, 'DELETE', OLD.quantity, OLD.type, OLD.created_by
    );
END;

-- Trigger for transaction inserts
CREATE TRIGGER tr_transaction_audit_insert
    AFTER INSERT ON transactions
    FOR EACH ROW
BEGIN
    INSERT INTO transaction_audit (
        transaction_id, action, new_quantity, new_type, changed_by
    ) VALUES (
        NEW.id, 'INSERT', NEW.quantity, NEW.type, NEW.created_by
    );
END;

-- ============================================
-- Additional Utility Procedures
-- ============================================

-- Procedure to get stock value summary
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

-- Procedure to get stock movement by category
CREATE PROCEDURE GetStockMovementByCategory(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        i.category,
        COUNT(DISTINCT i.id) as item_count,
        COALESCE(SUM(CASE WHEN t.type = 'in' THEN t.quantity ELSE 0 END), 0) as total_in,
        COALESCE(SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) as total_out,
        COALESCE(SUM(CASE WHEN t.type = 'in' THEN t.quantity ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) as net_movement
    FROM items i
    LEFT JOIN transactions t ON i.id = t.item_id 
        AND t.date BETWEEN p_start_date AND p_end_date
    GROUP BY i.category
    ORDER BY net_movement DESC;
END;

-- Procedure to get low stock items by category
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
-- End of Triggers and Additional Procedures
-- ============================================ 