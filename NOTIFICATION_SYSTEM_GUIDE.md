# Notification System Guide

## Overview
The notification system now properly filters notifications by the logged-in dealer's ID and only shows notifications where `for_dealer = 1`. **No dummy or test notifications are created** - only real notifications are generated when actual events occur.

## How It Works

### 1. **Database Filtering**
The system uses this query to fetch notifications:
```sql
SELECT * FROM notifications 
WHERE for_dealer = 1 AND dealer_id = ?
ORDER BY created_at DESC 
LIMIT ? OFFSET ?
```

### 2. **Key Points**
- ✅ **`for_dealer = 1`** - Only shows notifications intended for dealers
- ✅ **`dealer_id = ?`** - Only shows notifications for the logged-in dealer
- ✅ **No vendor_id** - Removed vendor_id references as requested
- ✅ **Proper isolation** - Each dealer only sees their own notifications

### 3. **Notification Types**
- **`product_created`** - When dealer creates a product
- **`product_approved`** - When admin approves a product
- **`product_rejected`** - When admin rejects a product  
- **`order_placed`** - When customer places an order

## Database Structure

### Notifications Table
```sql
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('product_created', 'product_approved', 'product_rejected', 'order_placed'),
  title VARCHAR(100),
  message TEXT,
  for_admin TINYINT(1) DEFAULT 0,
  for_dealer TINYINT(1) DEFAULT 0,  -- Must be 1 for dealer notifications
  for_user TINYINT(1) DEFAULT 0,
  for_vendor TINYINT(1) DEFAULT 0,
  product_id VARCHAR(50),
  order_id VARCHAR(50),              -- String type (not INT)
  user_id VARCHAR(50),               -- String type (not INT)
  vendor_id VARCHAR(50),             -- String type (not INT)
  dealer_id VARCHAR(50),             -- Links to specific dealer
  metadata JSON,
  is_read TINYINT(1) DEFAULT 0,
  is_delivered TINYINT(1) DEFAULT 0,
  whatsapp_delivered TINYINT(1) DEFAULT 0,
  email_delivered TINYINT(1) DEFAULT 0,
  sms_delivered TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## API Endpoints

### GET /api/notifications
**Parameters:**
- `dealer_id` (required) - The logged-in dealer's ID
- `limit` (optional) - Number of notifications to fetch (default: 10)
- `offset` (optional) - Pagination offset (default: 0)

**Example:**
```
GET /api/notifications?dealer_id=DLR7&limit=20
```

### PUT /api/notifications
**Body:**
```json
{
  "notificationId": 123,
  "isRead": true
}
```

## Testing

### 1. Check Notifications Table
```bash
# The system no longer creates dummy notifications
# Only real notifications are created when actual events occur
```

### 2. Test in Dashboard
1. Go to dashboard: `http://localhost:3000/dashboard`
2. Click the notification bell icon
3. You should only see notifications for dealer DLR7

### 3. Create a Product
1. Go to Products tab
2. Create a new product
3. Check notification bell - should show new notification

## Security Features

✅ **Dealer Isolation** - Each dealer only sees their own notifications
✅ **Proper Filtering** - Only shows notifications where `for_dealer = 1`
✅ **No Cross-Dealer Access** - Cannot see other dealers' notifications
✅ **Parameter Validation** - API validates dealer_id parameter

## Example Notifications

### Product Created
```json
{
  "type": "product_created",
  "title": "Product Created Successfully",
  "message": "Your product \"iPhone 15 Pro\" has been created and is pending approval",
  "for_dealer": 1,
  "dealer_id": "DLR7",
  "product_id": "PROD001"
}
```

### Product Approved
```json
{
  "type": "product_approved", 
  "title": "Product Approved",
  "message": "Your product \"Samsung Galaxy S24\" has been approved and is now live",
  "for_dealer": 1,
  "dealer_id": "DLR7",
  "product_id": "PROD002"
}
```

### Order Placed
```json
{
  "type": "order_placed",
  "title": "New Order Received", 
  "message": "Order #ORD001 has been placed for your product \"iPhone 15 Pro\"",
  "for_dealer": 1,
  "dealer_id": "DLR7",
  "order_id": "ORD001"
}
```

## Troubleshooting

### No Notifications Showing
1. Check if `for_dealer = 1` in database
2. Verify `dealer_id` matches logged-in dealer
3. Check API response in browser console

### Wrong Dealer Notifications
1. Ensure `dealer_id` is correctly set in notifications table
2. Verify API is using correct dealer_id parameter
3. Check database query filtering

### API Errors
1. Check if dealer_id parameter is provided
2. Verify database connection
3. Check notification table structure 