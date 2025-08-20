-- Migration: Add multiple image columns to products table
-- Run this SQL to add support for multiple product images (up to 4 images per product)

-- Add additional image columns to products table
ALTER TABLE products 
ADD COLUMN image_1 LONGBLOB NULL COMMENT 'Additional image 1 for product',
ADD COLUMN image_2 LONGBLOB NULL COMMENT 'Additional image 2 for product',
ADD COLUMN image_3 LONGBLOB NULL COMMENT 'Additional image 3 for product',
ADD COLUMN image_4 LONGBLOB NULL COMMENT 'Additional image 4 for product';

-- Note: The primary image is still stored in the 'image' column
-- Additional images (up to 4) are stored in image_1, image_2, image_3, image_4 columns
-- This approach simplifies the database structure and improves performance 

-- Migration: Create notifications table
-- Run this SQL to create the notifications table for the notification system

CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('product_created', 'product_approved', 'product_rejected', 'order_placed', 'user_registered', 'vendor_registered') NOT NULL,
  title VARCHAR(100),
  message TEXT,
  for_admin TINYINT(1) DEFAULT 0,
  for_dealer TINYINT(1) DEFAULT 0,
  for_user TINYINT(1) DEFAULT 0,
  for_vendor TINYINT(1) DEFAULT 0,
  product_id VARCHAR(50),
  order_id VARCHAR(50),
  user_id VARCHAR(50),
  vendor_id VARCHAR(50),
  dealer_id VARCHAR(50),
  is_read TINYINT(1) DEFAULT 0,
  is_delivered TINYINT(1) DEFAULT 0,
  whatsapp_delivered TINYINT(1) DEFAULT 0,
  email_delivered TINYINT(1) DEFAULT 0,
  sms_delivered TINYINT(1) DEFAULT 0,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for better performance
  INDEX idx_notifications_type (type),
  INDEX idx_notifications_roles (for_admin, for_dealer, for_user, for_vendor),
  INDEX idx_notifications_created (created_at),
  INDEX idx_notifications_dealer (dealer_id),
  INDEX idx_notifications_product (product_id),
  INDEX idx_notifications_order (order_id),
  INDEX idx_notifications_user (user_id),
  INDEX idx_notifications_vendor (vendor_id)
);

-- No sample notifications - only real notifications will be created 