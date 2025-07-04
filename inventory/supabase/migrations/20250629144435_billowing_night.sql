-- Inventory Management Database Schema
-- Created for MySQL

CREATE DATABASE IF NOT EXISTS inventory_db;
USE inventory_db;

-- Users table for authentication
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    barcode_id VARCHAR(255) UNIQUE NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    initial_stock INT NOT NULL DEFAULT 0,
    current_stock INT NOT NULL DEFAULT 0,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_barcode (barcode_id),
    INDEX idx_category (category),
    INDEX idx_brand (brand)
);

-- Incoming goods table
CREATE TABLE incoming_goods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_code VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    resi_number VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    platform VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_code) REFERENCES products(code) ON DELETE CASCADE,
    INDEX idx_product_code (product_code),
    INDEX idx_date (date),
    INDEX idx_platform (platform)
);

-- Outgoing goods table
CREATE TABLE outgoing_goods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_code VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    resi_number VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    barcode VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_code) REFERENCES products(code) ON DELETE CASCADE,
    INDEX idx_product_code (product_code),
    INDEX idx_date (date),
    INDEX idx_barcode (barcode)
);

-- Damaged goods table
CREATE TABLE damaged_goods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    barcode_id VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    stock INT NOT NULL,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    damage_reason TEXT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_date (date),
    INDEX idx_category (category)
);

-- Orders table for order management with pricing
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_code VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_code) REFERENCES products(code) ON DELETE CASCADE,
    INDEX idx_product_code (product_code),
    INDEX idx_date (date)
);

-- Insert default admin user
-- Password: admin123 (hashed with bcrypt)
INSERT INTO users (name, email, password) VALUES 
('Administrator', 'admin@inventory.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Sample data for testing
INSERT INTO products (barcode_id, code, name, initial_stock, current_stock, category, brand) VALUES
('1234567890123', 'PRD001', 'Laptop ASUS ROG', 10, 10, 'Electronics', 'ASUS'),
('1234567890124', 'PRD002', 'Mouse Gaming', 25, 25, 'Electronics', 'Logitech'),
('1234567890125', 'PRD003', 'Keyboard Mechanical', 15, 15, 'Electronics', 'Corsair'),
('1234567890126', 'PRD004', 'Monitor 24 inch', 8, 8, 'Electronics', 'Samsung'),
('1234567890127', 'PRD005', 'Headset Gaming', 20, 20, 'Electronics', 'SteelSeries');

-- Sample incoming goods
INSERT INTO incoming_goods (product_code, product_name, category, brand, resi_number, quantity, platform, date) VALUES
('PRD001', 'Laptop ASUS ROG', 'Electronics', 'ASUS', 'RSI001', 5, 'Tokopedia', '2024-01-15'),
('PRD002', 'Mouse Gaming', 'Electronics', 'Logitech', 'RSI002', 10, 'Shopee', '2024-01-16'),
('PRD003', 'Keyboard Mechanical', 'Electronics', 'Corsair', 'RSI003', 8, 'Lazada', '2024-01-17');

-- Sample outgoing goods
INSERT INTO outgoing_goods (product_code, product_name, category, brand, resi_number, quantity, barcode, date) VALUES
('PRD001', 'Laptop ASUS ROG', 'Electronics', 'ASUS', 'RSO001', 2, '1234567890123', '2024-01-18'),
('PRD002', 'Mouse Gaming', 'Electronics', 'Logitech', 'RSO002', 5, '1234567890124', '2024-01-19');

-- Sample orders
INSERT INTO orders (product_code, product_name, category, brand, quantity, price, date) VALUES
('PRD001', 'Laptop ASUS ROG', 'Electronics', 'ASUS', 3, 15000000.00, '2024-01-20'),
('PRD002', 'Mouse Gaming', 'Electronics', 'Logitech', 10, 250000.00, '2024-01-21'),
('PRD003', 'Keyboard Mechanical', 'Electronics', 'Corsair', 5, 800000.00, '2024-01-22');

-- Update current stock based on transactions
UPDATE products p SET current_stock = (
    p.initial_stock + 
    COALESCE((SELECT SUM(quantity) FROM incoming_goods WHERE product_code = p.code), 0) - 
    COALESCE((SELECT SUM(quantity) FROM outgoing_goods WHERE product_code = p.code), 0)
);

-- Create indexes for better performance
CREATE INDEX idx_products_stock ON products(current_stock);
CREATE INDEX idx_incoming_date_product ON incoming_goods(date, product_code);
CREATE INDEX idx_outgoing_date_product ON outgoing_goods(date, product_code);
CREATE INDEX idx_orders_date_product ON orders(date, product_code);

-- Views for reporting
CREATE VIEW stock_summary AS
SELECT 
    p.code,
    p.name,
    p.category,
    p.brand,
    p.initial_stock,
    p.current_stock,
    COALESCE(SUM(ig.quantity), 0) as total_incoming,
    COALESCE(SUM(og.quantity), 0) as total_outgoing
FROM products p
LEFT JOIN incoming_goods ig ON p.code = ig.product_code
LEFT JOIN outgoing_goods og ON p.code = og.product_code
GROUP BY p.id;

CREATE VIEW low_stock_alert AS
SELECT 
    code,
    name,
    category,
    brand,
    current_stock
FROM products 
WHERE current_stock <= 5
ORDER BY current_stock ASC;

-- Triggers to automatically update stock
DELIMITER //

CREATE TRIGGER update_stock_after_incoming
AFTER INSERT ON incoming_goods
FOR EACH ROW
BEGIN
    UPDATE products 
    SET current_stock = current_stock + NEW.quantity 
    WHERE code = NEW.product_code;
END//

CREATE TRIGGER update_stock_after_outgoing
AFTER INSERT ON outgoing_goods
FOR EACH ROW
BEGIN
    UPDATE products 
    SET current_stock = current_stock - NEW.quantity 
    WHERE code = NEW.product_code;
END//

DELIMITER ;

-- Grant privileges (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON inventory_db.* TO 'inventory_user'@'localhost' IDENTIFIED BY 'your_password';
-- FLUSH PRIVILEGES;