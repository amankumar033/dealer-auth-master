-- Update notification types to include order_accepted and order_rejected
ALTER TABLE notifications 
MODIFY COLUMN type ENUM(
  'product_created', 
  'product_approved', 
  'product_rejected', 
  'order_placed', 
  'order_accepted',
  'order_rejected',
  'user_registered', 
  'vendor_registered'
) NOT NULL;

-- Add description column for notifications
ALTER TABLE notifications 
ADD COLUMN description TEXT AFTER message;

-- Update existing order_placed notifications to have proper descriptions
UPDATE notifications 
SET description = 'New order received. Please review and accept or reject.'
WHERE type = 'order_placed' AND description IS NULL;
