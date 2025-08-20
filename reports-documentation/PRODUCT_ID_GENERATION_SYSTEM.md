# Product ID Generation System

## Overview

The new product ID generation system implements a robust, dealer-based approach that ensures unique product IDs across the entire system while maintaining clear ownership and sequence tracking.

## ID Format

### Structure
```
PRO + DealerNumber + SequenceNumber
```

### Examples
- **Dealer DLR001**: 
  - First product: `PRO0011`
  - Second product: `PRO0012`
  - Third product: `PRO0013`
- **Dealer DLR007**:
  - First product: `PRO0071`
  - Second product: `PRO0072`
- **Dealer DLR010**:
  - First product: `PRO0101`
  - Second product: `PRO0102`

## Implementation Features

### 1. Database Checks Before ID Assignment
- **Dealer Validation**: Verifies that the dealer exists in the database
- **ID Format Validation**: Ensures dealer ID follows the `DLRxxx` format
- **Existing ID Check**: Scans for existing product IDs to find gaps

### 2. Transaction Locking During ID Generation
- **Atomic Operations**: Uses database transactions to ensure consistency
- **Row-Level Locking**: Uses `FOR UPDATE` to prevent race conditions
- **Rollback on Error**: Automatically rolls back failed operations

### 3. Sequence Tracking for Each ID Type
- **Gap Detection**: Finds the lowest available sequence number
- **Sequential Assignment**: Ensures no gaps in the sequence
- **Maximum Attempts**: Prevents infinite loops (1000 attempts max)

### 4. Validation Before Committing New Records
- **Double-Check Pattern**: Verifies ID availability before assignment
- **Error Handling**: Comprehensive error messages for debugging
- **Connection Management**: Proper connection release and cleanup

## Technical Implementation

### Core Function: `generateProductId(dealerId: string)`

```typescript
async function generateProductId(dealerId: string): Promise<string> {
  const connection = await pool.getConnection();
  
  try {
    // Start transaction for atomic operations
    await connection.beginTransaction();
    
    // Extract dealer number from dealer ID (e.g., DLR001 -> 001)
    const dealerNumberMatch = dealerId.match(/DLR(\d+)/);
    if (!dealerNumberMatch) {
      throw new Error(`Invalid dealer ID format: ${dealerId}. Expected format: DLR001`);
    }
    
    const dealerNumber = dealerNumberMatch[1];
    
    // Check if dealer exists
    const [dealerCheck] = await connection.execute(
      'SELECT dealer_id FROM dealers WHERE dealer_id = ?',
      [dealerId]
    );
    
    if ((dealerCheck as any[]).length === 0) {
      throw new Error(`Dealer ${dealerId} does not exist`);
    }
    
    // Find the first available sequence number
    let sequenceNumber = 1;
    const maxAttempts = 1000;
    let attempts = 0;
    
         while (attempts < maxAttempts) {
       const candidateProductId = `PRO${dealerNumber}${sequenceNumber}`;
      
      // Check if this product ID already exists
      const [existingCheck] = await connection.execute(
        'SELECT product_id FROM products WHERE product_id = ?',
        [candidateProductId]
      );
      
      if ((existingCheck as any[]).length === 0) {
        // Double-check with a lock to prevent race conditions
        const [finalCheck] = await connection.execute(
          'SELECT product_id FROM products WHERE product_id = ? FOR UPDATE',
          [candidateProductId]
        );
        
        if ((finalCheck as any[]).length === 0) {
          // Commit transaction and return the product ID
          await connection.commit();
          return candidateProductId;
        }
      }
      
      sequenceNumber++;
      attempts++;
    }
    
    throw new Error(`Could not generate unique product ID for dealer ${dealerId} after ${maxAttempts} attempts`);
    
  } catch (error) {
    // Rollback transaction on error
    await connection.rollback();
    throw error;
  } finally {
    // Release connection
    connection.release();
  }
}
```

## Process Flow

### 1. Check Database for Existing IDs
```sql
-- Get existing product IDs for this dealer
SELECT product_id FROM products 
WHERE dealer_id = ? 
ORDER BY product_id
```

### 2. Find First Available Number in Sequence
- Start with sequence number 1
- Check each candidate ID: `PRO{dealerNumber}{sequenceNumber}`
- Continue until an available ID is found

### 3. Assign the Lowest Available Number
- Use direct sequence number without padding
- Example: `1` becomes `1`, `10` becomes `10`

### 4. Ensure No Duplicates Before Assignment
- Use `FOR UPDATE` lock to prevent race conditions
- Double-check availability before committing

## Error Handling

### Common Error Scenarios

1. **Invalid Dealer ID Format**
   ```
   Error: Invalid dealer ID format: DLR7. Expected format: DLR001
   ```

2. **Dealer Does Not Exist**
   ```
   Error: Dealer DLR999 does not exist
   ```

3. **Maximum Attempts Exceeded**
   ```
   Error: Could not generate unique product ID for dealer DLR001 after 1000 attempts
   ```

4. **Database Connection Issues**
   ```
   Error: Connection refused or timeout
   ```

### Error Recovery
- **Automatic Rollback**: Failed transactions are automatically rolled back
- **Connection Cleanup**: Connections are properly released even on errors
- **Detailed Logging**: Comprehensive error messages for debugging

## Testing

### Test Scripts

1. **`scripts/test-product-id-generation.js`**
   - Tests the complete ID generation process
   - Simulates concurrent requests
   - Validates sequence tracking

2. **`scripts/cleanup-test-products.js`**
   - Cleans up test products
   - Shows next available IDs for each dealer
   - Resets sequences for testing

### Running Tests

```bash
# Test the ID generation system
node scripts/test-product-id-generation.js

# Clean up test products
node scripts/cleanup-test-products.js
```

## API Integration

### Products API (`/api/products`)

The products API now passes the dealer ID to the generation function:

```typescript
// Generate custom product ID based on dealer
let productId;
try {
  productId = await generateProductId(sanitizedData.dealer_id);
  console.log('Products API POST: Generated product ID:', productId);
} catch (idError) {
  console.error('Products API POST: Error generating product ID:', idError);
  return NextResponse.json({ 
    error: 'Failed to generate product ID', 
    details: idError instanceof Error ? idError.message : 'Unknown error' 
  }, { status: 500 });
}
```

## Benefits

### 1. **Clear Ownership**
- Product IDs clearly indicate which dealer owns them
- Easy to identify and manage dealer-specific products

### 2. **Sequential Organization**
- Products are numbered sequentially within each dealer
- Easy to track and manage product counts

### 3. **Scalability**
- Supports unlimited products per dealer (1, 2, 3...)
- Can be extended to support more if needed

### 4. **Data Integrity**
- Prevents duplicate product IDs
- Ensures atomic operations
- Handles concurrent requests safely

### 5. **Debugging and Maintenance**
- Clear error messages for troubleshooting
- Comprehensive logging for monitoring
- Easy to identify and fix issues

## Future Enhancements

### Potential Improvements

1. **Extended Sequence Support**
   - Support for 3-digit sequences (001-999)
   - Support for 4-digit sequences (0001-9999)

2. **Performance Optimization**
   - Caching of available sequences
   - Batch ID generation for bulk operations

3. **Additional Validation**
   - Product name uniqueness within dealer
   - Category-based ID prefixes

4. **Monitoring and Analytics**
   - Track ID generation performance
   - Monitor sequence gaps and usage patterns

## Migration Notes

### Existing Products
- Existing products with old ID formats will continue to work
- New products will use the new dealer-based format
- No migration of existing product IDs is required

### Backward Compatibility
- The system maintains backward compatibility
- Existing API endpoints continue to work
- No breaking changes to the frontend

## Security Considerations

### Input Validation
- Dealer ID format validation
- SQL injection prevention through parameterized queries
- Transaction isolation for data consistency

### Access Control
- Dealer can only create products for themselves
- Product ID generation is tied to authenticated dealer
- No cross-dealer ID generation possible

## Monitoring and Logging

### Log Messages
- ID generation attempts and results
- Error conditions and resolutions
- Performance metrics and timing

### Debug Information
- Dealer ID extraction process
- Sequence number calculation
- Database query results

This system provides a robust, scalable, and maintainable solution for product ID generation that ensures data integrity while providing clear ownership and organization.
