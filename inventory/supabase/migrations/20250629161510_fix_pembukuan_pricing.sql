-- Fix Pembukuan Pricing Bug
-- Add pricing columns to outgoing_goods table to store pricing per transaction instead of per product

USE inventory_db;

-- Add pricing columns to outgoing_goods table
ALTER TABLE outgoing_goods 
ADD COLUMN purchase_price DECIMAL(10,2) DEFAULT 0.00 AFTER quantity,
ADD COLUMN selling_price DECIMAL(10,2) DEFAULT 0.00 AFTER purchase_price,
ADD COLUMN discount DECIMAL(10,2) DEFAULT 0.00 AFTER selling_price;

-- Migrate existing pricing data from pembukuan table to outgoing_goods table
UPDATE outgoing_goods og
JOIN pembukuan pb ON og.product_code = pb.product_code
SET 
    og.purchase_price = pb.purchase_price,
    og.selling_price = pb.selling_price,
    og.discount = pb.discount
WHERE og.resi_number IS NOT NULL AND og.resi_number != '';

-- Add constraints for data integrity
ALTER TABLE outgoing_goods 
ADD CONSTRAINT chk_positive_prices_og 
CHECK (purchase_price >= 0 AND selling_price >= 0 AND discount >= 0);

ALTER TABLE outgoing_goods 
ADD CONSTRAINT chk_discount_not_exceed_selling_og 
CHECK (discount <= selling_price);

-- Create indexes for better performance
CREATE INDEX idx_outgoing_goods_pricing ON outgoing_goods(purchase_price, selling_price, discount);
CREATE INDEX idx_outgoing_goods_resi_pricing ON outgoing_goods(resi_number, purchase_price, selling_price);

-- Update the pembukuan_summary view to use the new structure
DROP VIEW IF EXISTS pembukuan_summary;

CREATE VIEW pembukuan_summary AS
SELECT 
    p.code,
    p.name,
    p.category,
    p.brand,
    p.current_stock,
    COALESCE(SUM(og.purchase_price * og.quantity), 0) as total_purchase_value,
    COALESCE(SUM(og.selling_price * og.quantity), 0) as total_selling_value,
    COALESCE(SUM(og.discount * og.quantity), 0) as total_discount_value,
    COALESCE(SUM(og.quantity), 0) as total_sold,
    COALESCE(SUM(
        CASE 
            WHEN og.selling_price > 0 AND og.purchase_price > 0 
            THEN (og.selling_price - og.discount - og.purchase_price) * og.quantity
            ELSE 0 
        END
    ), 0) as total_margin
FROM products p
LEFT JOIN outgoing_goods og ON p.code = og.product_code 
    AND og.resi_number IS NOT NULL AND og.resi_number != ''
GROUP BY p.code, p.name, p.category, p.brand, p.current_stock;

-- Add comments for documentation
ALTER TABLE outgoing_goods 
MODIFY COLUMN purchase_price DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Purchase price per unit for this transaction',
MODIFY COLUMN selling_price DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Selling price per unit for this transaction',
MODIFY COLUMN discount DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Discount per unit for this transaction';

-- Create a view for individual transaction margins
CREATE VIEW transaction_margins AS
SELECT 
    og.id,
    og.date,
    og.product_code,
    og.product_name,
    og.quantity,
    og.resi_number,
    og.purchase_price,
    og.selling_price,
    og.discount,
    CASE 
        WHEN og.selling_price > 0 AND og.purchase_price > 0 
        THEN (og.selling_price - og.discount - og.purchase_price) * og.quantity
        ELSE 0 
    END as margin,
    CASE 
        WHEN og.selling_price > 0 AND og.purchase_price > 0 
        THEN (og.selling_price - og.discount - og.purchase_price) / og.purchase_price * 100
        ELSE 0 
    END as margin_percentage
FROM outgoing_goods og
WHERE og.resi_number IS NOT NULL AND og.resi_number != ''
ORDER BY og.date DESC;

-- Insert sample pricing data for existing outgoing goods (if any exist without pricing)
INSERT IGNORE INTO outgoing_goods (product_code, product_name, category, brand, quantity, purchase_price, selling_price, discount, resi_number, date)
SELECT 
    p.code,
    p.name,
    p.category,
    p.brand,
    1,
    100000.00,
    120000.00,
    5000.00,
    CONCAT('SAMPLE', LPAD(p.id, 3, '0')),
    NOW()
FROM products p
WHERE NOT EXISTS (
    SELECT 1 FROM outgoing_goods og 
    WHERE og.product_code = p.code 
    AND og.resi_number IS NOT NULL 
    AND og.resi_number != ''
)
LIMIT 5;

-- Update activity log to reflect the change
INSERT INTO activity_logs (user_id, action, details) VALUES
(1, 'SYSTEM_UPDATE', 'Fixed pembukuan pricing bug: moved pricing from product-level to transaction-level');

-- Create a summary view for daily margins
CREATE VIEW daily_margin_summary AS
SELECT 
    DATE(og.date) as transaction_date,
    COUNT(*) as total_transactions,
    SUM(og.quantity) as total_quantity,
    SUM(og.purchase_price * og.quantity) as total_purchase_value,
    SUM(og.selling_price * og.quantity) as total_selling_value,
    SUM(og.discount * og.quantity) as total_discount_value,
    SUM(
        CASE 
            WHEN og.selling_price > 0 AND og.purchase_price > 0 
            THEN (og.selling_price - og.discount - og.purchase_price) * og.quantity
            ELSE 0 
        END
    ) as total_margin
FROM outgoing_goods og
WHERE og.resi_number IS NOT NULL AND og.resi_number != ''
GROUP BY DATE(og.date)
ORDER BY transaction_date DESC; 