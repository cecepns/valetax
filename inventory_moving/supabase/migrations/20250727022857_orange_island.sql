-- ============================================
-- Database Schema for Inventory Management System
-- Compatible with XAMPP 8.2.4-0 (MariaDB 10.4.28)
-- ============================================

-- Create database
CREATE DATABASE IF NOT EXISTS inventory_moving;
USE inventory_moving;

-- ============================================
-- Table: users
-- Stores user authentication and role information
-- ============================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- Table: items
-- Master data for inventory items
-- ============================================
CREATE TABLE items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    category ENUM('Gudang Kain', 'Gudang Dus', 'Gudang Tali') NOT NULL,
    unit VARCHAR(20) NOT NULL,
    min_stock INT NOT NULL DEFAULT 0,
    price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- Table: transactions
-- Records all incoming and outgoing inventory transactions
-- ============================================
CREATE TABLE transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    type ENUM('in', 'out') NOT NULL,
    date DATE NOT NULL,
    supplier VARCHAR(255) NULL, -- For 'in' transactions
    recipient VARCHAR(255) NULL, -- For 'out' transactions
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- ============================================
-- Indexes for better performance
-- ============================================
CREATE INDEX idx_transactions_item_id ON transactions(item_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_code ON items(code);

-- ============================================
-- Sample Data
-- ============================================

-- Insert default users
-- Password: admin123 (hashed)
INSERT INTO users (username, password, role) VALUES 
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('manager', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager');

-- Insert sample items
INSERT INTO items (name, code, category, unit, min_stock, price, description) VALUES
-- Gudang Kain
('Kain Katun Premium', 'KTN001', 'Gudang Kain', 'meter', 50, 25000.00, 'Kain katun berkualitas tinggi untuk produksi'),
('Kain Polyester', 'PLY001', 'Gudang Kain', 'meter', 30, 18000.00, 'Kain polyester untuk lining'),
('Kain Denim', 'DNM001', 'Gudang Kain', 'meter', 25, 35000.00, 'Kain denim untuk produk jeans'),
('Kain Sutra', 'STR001', 'Gudang Kain', 'meter', 20, 75000.00, 'Kain sutra premium'),

-- Gudang Dus
('Dus Kemasan Kecil', 'DUS001', 'Gudang Dus', 'pcs', 100, 2500.00, 'Dus untuk kemasan produk kecil'),
('Dus Kemasan Sedang', 'DUS002', 'Gudang Dus', 'pcs', 80, 4000.00, 'Dus untuk kemasan produk sedang'),
('Dus Kemasan Besar', 'DUS003', 'Gudang Dus', 'pcs', 50, 6500.00, 'Dus untuk kemasan produk besar'),
('Dus Gift Box', 'GFT001', 'Gudang Dus', 'pcs', 40, 8000.00, 'Dus khusus untuk hadiah'),

-- Gudang Tali
('Tali Nilon 3mm', 'TNL003', 'Gudang Tali', 'roll', 20, 15000.00, 'Tali nilon diameter 3mm'),
('Tali Nilon 5mm', 'TNL005', 'Gudang Tali', 'roll', 15, 22000.00, 'Tali nilon diameter 5mm'),
('Tali Rami', 'TRM001', 'Gudang Tali', 'roll', 10, 18000.00, 'Tali rami natural'),
('Tali Elastis', 'TEL001', 'Gudang Tali', 'roll', 25, 12000.00, 'Tali elastis untuk berbagai keperluan');

-- Insert sample transactions to demonstrate fast/slow/dead stock analysis
-- Recent transactions (last 3 months) - Fast moving items
INSERT INTO transactions (item_id, quantity, type, date, supplier, recipient, notes, created_by) VALUES
-- Kain Katun Premium (Fast moving)
(1, 100, 'in', '2024-01-15', 'PT Tekstil Jaya', NULL, 'Pembelian rutin bulanan', 1),
(1, 80, 'out', '2024-01-20', NULL, 'Produksi A', 'Untuk produksi batch #001', 1),
(1, 150, 'in', '2024-02-10', 'PT Tekstil Jaya', NULL, 'Stok tambahan', 1),
(1, 120, 'out', '2024-02-15', NULL, 'Produksi A', 'Untuk produksi batch #002', 1),
(1, 200, 'in', '2024-03-05', 'PT Tekstil Jaya', NULL, 'Order besar', 1),
(1, 180, 'out', '2024-03-10', NULL, 'Produksi A', 'Untuk produksi batch #003', 1),

-- Dus Kemasan Kecil (Fast moving)
(5, 500, 'in', '2024-01-10', 'CV Kemasan Prima', NULL, 'Stock bulanan', 1),
(5, 400, 'out', '2024-01-25', NULL, 'Packing Dept', 'Kemasan produk jadi', 1),
(5, 600, 'in', '2024-02-08', 'CV Kemasan Prima', NULL, 'Tambahan stock', 1),
(5, 500, 'out', '2024-02-20', NULL, 'Packing Dept', 'Kemasan produk jadi', 1),
(5, 400, 'in', '2024-03-01', 'CV Kemasan Prima', NULL, 'Stock rutin', 1),
(5, 350, 'out', '2024-03-15', NULL, 'Packing Dept', 'Kemasan produk jadi', 1),

-- Slow moving items
-- Kain Sutra (Slow moving - expensive, limited demand)
(4, 50, 'in', '2024-01-01', 'PT Sutra Indah', NULL, 'Stock premium', 1),
(4, 10, 'out', '2024-02-01', NULL, 'Produksi Premium', 'Produk khusus', 1),
(4, 30, 'in', '2024-02-15', 'PT Sutra Indah', NULL, 'Tambahan kecil', 1),
(4, 5, 'out', '2024-03-01', NULL, 'Produksi Premium', 'Order custom', 1),

-- Dus Gift Box (Slow moving - seasonal)
(8, 100, 'in', '2024-01-05', 'CV Kemasan Prima', NULL, 'Persiapan musim', 1),
(8, 20, 'out', '2024-01-30', NULL, 'Packing Dept', 'Order spesial', 1),
(8, 50, 'in', '2024-02-20', 'CV Kemasan Prima', NULL, 'Stock tambahan', 1),
(8, 15, 'out', '2024-03-05', NULL, 'Packing Dept', 'Gift package', 1),

-- Dead stock items (no recent movement or very minimal)
-- Tali Rami (Dead stock - old technology, rarely used)
(11, 20, 'in', '2023-10-01', 'UD Tali Tradisional', NULL, 'Stock lama', 1),
(11, 2, 'out', '2023-11-15', NULL, 'Produksi C', 'Keperluan khusus', 1),

-- Kain Polyester (Dead stock - changed to different supplier/type)
(2, 80, 'in', '2023-09-01', 'PT Fiber Tech', NULL, 'Stock lama', 1),
(2, 5, 'out', '2023-12-01', NULL, 'Produksi B', 'Sisa project', 1),

-- More regular transactions for other items
-- Kain Denim (Regular movement)
(3, 60, 'in', '2024-01-12', 'PT Denim Indonesia', NULL, 'Stock bulanan', 1),
(3, 30, 'out', '2024-01-28', NULL, 'Produksi Jeans', 'Produksi rutin', 1),
(3, 80, 'in', '2024-02-18', 'PT Denim Indonesia', NULL, 'Order besar', 1),
(3, 45, 'out', '2024-03-08', NULL, 'Produksi Jeans', 'Batch baru', 1),

-- Dus Kemasan Sedang (Regular movement)
(6, 200, 'in', '2024-01-08', 'CV Kemasan Prima', NULL, 'Stock rutin', 1),
(6, 120, 'out', '2024-01-22', NULL, 'Packing Dept', 'Kemasan sedang', 1),
(6, 180, 'in', '2024-02-12', 'CV Kemasan Prima', NULL, 'Restok', 1),
(6, 100, 'out', '2024-02-28', NULL, 'Packing Dept', 'Packing order', 1),

-- Tali Nilon 3mm (Regular movement)
(9, 30, 'in', '2024-01-18', 'PT Tali Sintetis', NULL, 'Stock bulanan', 1),
(9, 15, 'out', '2024-02-05', NULL, 'Produksi Aksesoris', 'Produksi tali', 1),
(9, 25, 'in', '2024-02-25', 'PT Tali Sintetis', NULL, 'Tambahan stock', 1),
(9, 12, 'out', '2024-03-12', NULL, 'Produksi Aksesoris', 'Order custom', 1);

-- ============================================
-- Views for easy reporting
-- ============================================

-- View for current stock levels
CREATE VIEW v_current_stock AS
SELECT 
    i.id,
    i.name,
    i.code,
    i.category,
    i.unit,
    i.min_stock,
    i.price,
    COALESCE(SUM(CASE WHEN t.type = 'in' THEN t.quantity ELSE 0 END), 0) as total_in,
    COALESCE(SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) as total_out,
    COALESCE(SUM(CASE WHEN t.type = 'in' THEN t.quantity ELSE 0 END) - 
             SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) as current_stock,
    CASE 
        WHEN COALESCE(SUM(CASE WHEN t.type = 'in' THEN t.quantity ELSE 0 END) - 
                     SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) <= i.min_stock 
        THEN 'REORDER'
        WHEN COALESCE(SUM(CASE WHEN t.type = 'in' THEN t.quantity ELSE 0 END) - 
                     SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) <= i.min_stock * 1.5 
        THEN 'LOW_STOCK'
        ELSE 'GOOD'
    END as stock_status
FROM items i
LEFT JOIN transactions t ON i.id = t.item_id
GROUP BY i.id, i.name, i.code, i.category, i.unit, i.min_stock, i.price;

-- View for stock analysis with turnover ratio
CREATE VIEW v_stock_analysis AS
SELECT 
    i.id,
    i.name,
    i.code,
    i.category,
    i.unit,
    COALESCE(SUM(CASE WHEN t.type = 'in' THEN t.quantity ELSE 0 END), 0) as total_in,
    COALESCE(SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) as total_out,
    COALESCE(SUM(CASE WHEN t.type = 'in' THEN t.quantity ELSE 0 END) - 
             SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) as current_stock,
    CASE 
        WHEN AVG(CASE WHEN t.type = 'in' THEN t.quantity ELSE NULL END) > 0 
        THEN COALESCE(SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) / 
             AVG(CASE WHEN t.type = 'in' THEN t.quantity ELSE NULL END)
        ELSE 0 
    END as turnover_ratio,
    CASE 
        WHEN (CASE 
                WHEN AVG(CASE WHEN t.type = 'in' THEN t.quantity ELSE NULL END) > 0 
                THEN COALESCE(SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) / 
                     AVG(CASE WHEN t.type = 'in' THEN t.quantity ELSE NULL END)
                ELSE 0 
              END) >= 2.0 THEN 'FAST_MOVING'
        WHEN (CASE 
                WHEN AVG(CASE WHEN t.type = 'in' THEN t.quantity ELSE NULL END) > 0 
                THEN COALESCE(SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) / 
                     AVG(CASE WHEN t.type = 'in' THEN t.quantity ELSE NULL END)
                ELSE 0 
              END) >= 0.5 THEN 'SLOW_MOVING'
        ELSE 'DEAD_STOCK'
    END as movement_category,
    MAX(CASE WHEN t.type = 'out' THEN t.date ELSE NULL END) as last_out_date
FROM items i
LEFT JOIN transactions t ON i.id = t.item_id
GROUP BY i.id, i.name, i.code, i.category, i.unit;

-- ============================================
-- Stored Procedures for common operations (XAMPP Compatible)
-- ============================================

-- Procedure to get stock movement summary
CREATE PROCEDURE GetStockMovementSummary(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        i.name as item_name,
        i.code as item_code,
        i.category,
        COALESCE(SUM(CASE WHEN t.type = 'in' THEN t.quantity ELSE 0 END), 0) as total_in,
        COALESCE(SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) as total_out,
        COALESCE(SUM(CASE WHEN t.type = 'in' THEN t.quantity ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) as net_movement
    FROM items i
    LEFT JOIN transactions t ON i.id = t.item_id 
        AND t.date BETWEEN p_start_date AND p_end_date
    GROUP BY i.id, i.name, i.code, i.category
    ORDER BY net_movement DESC;
END;

-- Procedure to get reorder alerts
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

-- Procedure to get fast moving items
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

-- Procedure to get slow moving items
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

-- Procedure to get dead stock items
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

-- ============================================
-- Audit table for transaction tracking
-- ============================================

-- Create audit table
CREATE TABLE transaction_audit (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_id INT,
    action VARCHAR(10), -- INSERT, UPDATE, DELETE
    old_quantity INT,
    new_quantity INT,
    old_type VARCHAR(10),
    new_type VARCHAR(10),
    changed_by INT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Sample Queries for Testing
-- ============================================

-- Check current stock levels
-- SELECT * FROM v_current_stock ORDER BY current_stock DESC;

-- Get fast moving items
-- SELECT * FROM v_stock_analysis WHERE movement_category = 'FAST_MOVING' ORDER BY turnover_ratio DESC;

-- Get items that need reordering
-- CALL GetReorderAlerts();

-- Get stock movement for last month
-- CALL GetStockMovementSummary('2024-02-01', '2024-02-29');

-- Get fast moving items
-- CALL GetFastMovingItems();

-- Get slow moving items
-- CALL GetSlowMovingItems();

-- Get dead stock items
-- CALL GetDeadStockItems();

-- ============================================
-- End of Database Schema
-- ============================================