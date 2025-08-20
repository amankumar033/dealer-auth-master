-- Create notifications table
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