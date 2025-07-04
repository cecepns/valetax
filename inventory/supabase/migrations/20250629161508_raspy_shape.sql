-- Additional migrations for new features
-- Role-based access, Pembukuan, Activity Logs, and Order updates

USE inventory_db;

-- Add role column to users table
ALTER TABLE users ADD COLUMN role ENUM('admin', 'manager') DEFAULT 'admin' AFTER email;

-- Update existing admin user to manager role
UPDATE users SET role = 'manager' WHERE email = 'admin@inventory.com';

-- Add resi_number column to orders table
ALTER TABLE orders ADD COLUMN resi_number VARCHAR(255) NOT NULL AFTER price;

-- Create pembukuan table for pricing and margin tracking
CREATE TABLE pembukuan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_code VARCHAR(100) NOT NULL,
    purchase_price DECIMAL(10,2) DEFAULT 0.00,
    selling_price DECIMAL(10,2) DEFAULT 0.00,
    discount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_code) REFERENCES products(code) ON DELETE CASCADE,
    UNIQUE KEY unique_product_code (product_code),
    INDEX idx_product_code (product_code)
);

-- Create activity_logs table for audit trail
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_timestamp (timestamp)
);

-- Insert sample users with different roles
INSERT INTO users (name, email, password, role) VALUES 
('Admin User', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Manager User', 'manager@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager');

-- Update sample orders with resi numbers
UPDATE orders SET resi_number = CONCAT('RSI', LPAD(id, 3, '0')) WHERE resi_number IS NULL OR resi_number = '';

-- Insert sample pembukuan data
INSERT INTO pembukuan (product_code, purchase_price, selling_price, discount) VALUES
('PRD001', 12000000.00, 15000000.00, 500000.00),
('PRD002', 200000.00, 250000.00, 25000.00),
('PRD003', 600000.00, 800000.00, 50000.00),
('PRD004', 2000000.00, 2500000.00, 100000.00),
('PRD005', 800000.00, 1000000.00, 50000.00);

-- Insert sample activity logs
INSERT INTO activity_logs (user_id, action, details) VALUES
(1, 'LOGIN', 'User admin@inventory.com logged in'),
(1, 'CREATE_PRODUCT', 'Created product: Laptop ASUS ROG (PRD001)'),
(1, 'INCOMING_GOODS', 'Added incoming goods: Laptop ASUS ROG (5 units)'),
(1, 'OUTGOING_GOODS', 'Added outgoing goods: Laptop ASUS ROG (2 units)'),
(1, 'GENERATE_REPORT', 'Generated stock report for 2024-01-01 to 2024-01-31');

-- Create indexes for better performance on new tables
CREATE INDEX idx_pembukuan_prices ON pembukuan(purchase_price, selling_price);
CREATE INDEX idx_activity_logs_user_action ON activity_logs(user_id, action);
CREATE INDEX idx_orders_resi ON orders(resi_number);

-- Create view for pembukuan summary (without DEFINER to avoid privilege issues)
CREATE VIEW pembukuan_summary AS
SELECT 
    p.code,
    p.name,
    p.category,
    p.brand,
    p.current_stock,
    COALESCE(pb.purchase_price, 0) as purchase_price,
    COALESCE(pb.selling_price, 0) as selling_price,
    COALESCE(pb.discount, 0) as discount,
    COALESCE(og.total_sold, 0) as total_sold,
    CASE 
        WHEN pb.selling_price > 0 AND pb.purchase_price > 0 
        THEN (pb.selling_price - pb.discount - pb.purchase_price) * COALESCE(og.total_sold, 0)
        ELSE 0 
    END as total_margin
FROM products p
LEFT JOIN pembukuan pb ON p.code = pb.product_code
LEFT JOIN (
    SELECT product_code, SUM(quantity) as total_sold 
    FROM outgoing_goods 
    GROUP BY product_code
) og ON p.code = og.product_code;

-- Create view for user activity summary (without DEFINER to avoid privilege issues)
CREATE VIEW user_activity_summary AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    COUNT(al.id) as total_activities,
    MAX(al.timestamp) as last_activity
FROM users u
LEFT JOIN activity_logs al ON u.id = al.user_id
GROUP BY u.id;

-- Add constraints for data integrity
ALTER TABLE pembukuan ADD CONSTRAINT chk_positive_prices 
CHECK (purchase_price >= 0 AND selling_price >= 0 AND discount >= 0);

ALTER TABLE pembukuan ADD CONSTRAINT chk_discount_not_exceed_selling 
CHECK (discount <= selling_price);

-- Update triggers to log activities automatically
DELIMITER //

-- Trigger for product creation logging
CREATE TRIGGER log_product_creation
AFTER INSERT ON products
FOR EACH ROW
BEGIN
    -- Note: user_id would need to be passed from application context
    -- This is a placeholder for the trigger structure
    INSERT INTO activity_logs (user_id, action, details) 
    VALUES (1, 'CREATE_PRODUCT', CONCAT('Created product: ', NEW.name, ' (', NEW.code, ')'));
END//

-- Trigger for automatic pembukuan record creation
CREATE TRIGGER create_pembukuan_record
AFTER INSERT ON products
FOR EACH ROW
BEGIN
    INSERT INTO pembukuan (product_code, purchase_price, selling_price, discount) 
    VALUES (NEW.code, 0.00, 0.00, 0.00);
END//

DELIMITER ;

-- Grant appropriate permissions for roles
-- Note: Adjust these based on your MySQL user setup
-- GRANT SELECT, INSERT, UPDATE ON inventory_db.incoming_goods TO 'admin_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE ON inventory_db.outgoing_goods TO 'admin_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE ON inventory_db.damaged_goods TO 'admin_user'@'localhost';
-- GRANT SELECT ON inventory_db.reports TO 'admin_user'@'localhost';

-- GRANT ALL PRIVILEGES ON inventory_db.* TO 'manager_user'@'localhost';

-- Add comments for documentation
ALTER TABLE users COMMENT = 'User accounts with role-based access control';
ALTER TABLE pembukuan COMMENT = 'Pricing and margin tracking for products';
ALTER TABLE activity_logs COMMENT = 'Audit trail for all user activities';
ALTER TABLE orders MODIFY COLUMN resi_number VARCHAR(255) NOT NULL COMMENT 'Tracking number for orders';

-- Final data consistency check and update
UPDATE products p 
SET current_stock = (
    p.initial_stock + 
    COALESCE((SELECT SUM(quantity) FROM incoming_goods WHERE product_code = p.code), 0) - 
    COALESCE((SELECT SUM(quantity) FROM outgoing_goods WHERE product_code = p.code), 0)
);

-- Create summary statistics view (without DEFINER to avoid privilege issues)
CREATE VIEW inventory_statistics AS
SELECT 
    'Total Products' as metric,
    COUNT(*) as value
FROM products
UNION ALL
SELECT 
    'Total Stock Value' as metric,
    SUM(current_stock) as value
FROM products
UNION ALL
SELECT 
    'Products with Pricing' as metric,
    COUNT(*) as value
FROM pembukuan 
WHERE selling_price > 0
UNION ALL
SELECT 
    'Total Activities Logged' as metric,
    COUNT(*) as value
FROM activity_logs;