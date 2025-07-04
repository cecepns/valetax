-- Add bank field to orders table
USE inventory_db;

-- Add bank column to orders table
ALTER TABLE orders ADD COLUMN bank VARCHAR(100) AFTER resi_number;

-- Update existing orders with default bank value
UPDATE orders SET bank = 'Tidak Diketahui' WHERE bank IS NULL;

-- Add index for better performance
CREATE INDEX idx_orders_bank ON orders(bank);

-- Add comment for documentation
ALTER TABLE orders MODIFY COLUMN bank VARCHAR(100) COMMENT 'Bank used for payment'; 