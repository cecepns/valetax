# Pembukuan Pricing Bug Fix

## Problem Description

The pembukuan (bookkeeping) functionality had a critical bug where editing pricing information for one outgoing goods transaction would affect ALL transactions of the same product. This happened because:

1. **Database Design Issue**: The `pembukuan` table stored pricing information per `product_code` with a unique constraint
2. **API Logic Issue**: The `/api/pembukuan` endpoint updated pricing based on `product_code`, affecting all transactions of that product
3. **UI Mismatch**: The frontend showed individual outgoing goods transactions, but pricing was stored per product

## Root Cause

```sql
-- Original problematic structure
CREATE TABLE pembukuan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_code VARCHAR(100) NOT NULL,
    purchase_price DECIMAL(10,2) DEFAULT 0.00,
    selling_price DECIMAL(10,2) DEFAULT 0.00,
    discount DECIMAL(10,2) DEFAULT 0.00,
    UNIQUE KEY unique_product_code (product_code)  -- This caused the issue
);
```

When editing pricing for transaction A of product X, it would update the `pembukuan` table for product X, which would then affect transaction B of the same product X.

## Solution

### 1. Database Schema Changes

**Added pricing columns to `outgoing_goods` table:**
```sql
ALTER TABLE outgoing_goods 
ADD COLUMN purchase_price DECIMAL(10,2) DEFAULT 0.00 AFTER quantity,
ADD COLUMN selling_price DECIMAL(10,2) DEFAULT 0.00 AFTER purchase_price,
ADD COLUMN discount DECIMAL(10,2) DEFAULT 0.00 AFTER selling_price;
```

**Benefits:**
- Each outgoing goods transaction now has its own pricing information
- No more cross-transaction interference
- Better data granularity and accuracy

### 2. API Changes

**Before (problematic):**
```javascript
// Updated pembukuan table based on product_code
await db.execute(
  'UPDATE pembukuan SET purchase_price = ?, selling_price = ?, discount = ? WHERE product_code = ?',
  [purchase_price, selling_price, discount, product_code]
);
```

**After (fixed):**
```javascript
// Update specific outgoing goods transaction
await db.execute(
  'UPDATE outgoing_goods SET purchase_price = ?, selling_price = ?, discount = ? WHERE id = ?',
  [purchase_price, selling_price, discount, outgoing_goods_id]
);
```

### 3. Frontend Changes

**Updated form data structure:**
```javascript
// Before
const [formData, setFormData] = useState({
  product_code: "",
  purchase_price: "",
  selling_price: "",
  discount: "",
});

// After
const [formData, setFormData] = useState({
  outgoing_goods_id: "",  // Now uses specific transaction ID
  purchase_price: "",
  selling_price: "",
  discount: "",
});
```

## Files Modified

### Backend Changes
- `backend/server.js`: Updated `/api/pembukuan` endpoints
  - GET: Now reads pricing from `outgoing_goods` table
  - POST: Now updates specific `outgoing_goods` record

### Frontend Changes
- `src/pages/Pembukuan.jsx`: Updated form handling
  - Changed from `product_code` to `outgoing_goods_id`
  - Updated form labels and data structure

### Database Migration
- `supabase/migrations/20250629161510_fix_pembukuan_pricing.sql`: Complete database schema update

## How to Apply the Fix

### 1. Apply Database Migration

```bash
# Navigate to the inventory directory
cd inventory

# Apply the migration (replace with your MySQL credentials)
mysql -u [username] -p [database_name] < supabase/migrations/20250629161510_fix_pembukuan_pricing.sql
```

### 2. Restart Backend Server

```bash
cd backend
npm start
```

### 3. Test the Fix

1. Go to the Pembukuan page
2. Create multiple outgoing goods transactions for the same product
3. Edit pricing for one transaction
4. Verify that other transactions of the same product are not affected

## Migration Details

The migration script performs the following operations:

1. **Adds pricing columns** to `outgoing_goods` table
2. **Migrates existing data** from `pembukuan` table to `outgoing_goods` table
3. **Adds data integrity constraints** for positive prices and valid discounts
4. **Creates performance indexes** for better query performance
5. **Updates database views** to work with the new structure
6. **Adds sample data** for testing (if needed)

## Benefits of the Fix

1. **Accurate Pricing**: Each transaction maintains its own pricing information
2. **No Cross-Contamination**: Editing one transaction doesn't affect others
3. **Better Data Integrity**: Pricing is stored at the transaction level where it belongs
4. **Improved Performance**: Direct queries without joins to separate pricing table
5. **Future-Proof**: Structure supports per-transaction pricing variations

## Verification

After applying the fix, verify that:

1. ✅ Editing pricing for transaction A doesn't affect transaction B (same product)
2. ✅ Each transaction shows its own pricing information
3. ✅ Profit calculations are accurate per transaction
4. ✅ Export functionality works correctly
5. ✅ Search and filtering work as expected

## Rollback Plan

If needed, the changes can be rolled back by:

1. Reverting the database migration
2. Restoring the original API endpoints
3. Reverting frontend changes

However, this would result in data loss for any new pricing information added after the fix.

## Testing Checklist

- [ ] Create multiple outgoing goods for the same product
- [ ] Edit pricing for one transaction
- [ ] Verify other transactions remain unchanged
- [ ] Test profit calculations
- [ ] Test export functionality
- [ ] Test search and filtering
- [ ] Test pagination
- [ ] Verify activity logging works correctly

## Support

If you encounter any issues during the migration or after applying the fix, please:

1. Check the database migration logs
2. Verify all files were updated correctly
3. Restart the backend server
4. Clear browser cache if needed 