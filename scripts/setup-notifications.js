const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupNotifications() {
  let connection;
  
  try {
    console.log('🔧 Setting up notifications table...');
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'kriptocar',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to database');

    // Create notifications table if it doesn't exist
    console.log('📋 Creating notifications table...');
    await connection.execute(`
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
        
        INDEX idx_notifications_type (type),
        INDEX idx_notifications_roles (for_admin, for_dealer, for_user, for_vendor),
        INDEX idx_notifications_created (created_at),
        INDEX idx_notifications_dealer (dealer_id),
        INDEX idx_notifications_product (product_id),
        INDEX idx_notifications_order (order_id),
        INDEX idx_notifications_user (user_id),
        INDEX idx_notifications_vendor (vendor_id)
      )
    `);
    console.log('✅ Notifications table created/verified');

    // Check if there are any notifications for DLR7
    console.log('🔍 Checking existing notifications for DLR7...');
    const [existingNotifications] = await connection.execute(`
      SELECT COUNT(*) as count FROM notifications WHERE dealer_id = ? AND for_dealer = 1
    `, ['DLR7']);
    
    console.log(`📊 Found ${existingNotifications[0].count} existing notifications for DLR7`);

    // If no notifications exist, create some test notifications
    if (existingNotifications[0].count === 0) {
      console.log('📝 Creating test notifications for DLR7...');
      
      const testNotifications = [
        {
          type: 'product_created',
          title: 'New Product Added',
          message: 'A new product "Test Product 1" has been added to your inventory.',
          for_dealer: 1,
          dealer_id: 'DLR7',
          product_id: 'PRO_TEST_1',
          metadata: JSON.stringify({ product_name: 'Test Product 1', price: 99.99 })
        },
        {
          type: 'order_placed',
          title: 'New Order Received',
          message: 'You have received a new order #ORD001 for $150.00',
          for_dealer: 1,
          dealer_id: 'DLR7',
          order_id: 'ORD001',
          metadata: JSON.stringify({ order_total: 150.00, customer_name: 'John Doe' })
        },
        {
          type: 'product_approved',
          title: 'Product Approved',
          message: 'Your product "Test Product 2" has been approved by admin.',
          for_dealer: 1,
          dealer_id: 'DLR7',
          product_id: 'PRO_TEST_2',
          metadata: JSON.stringify({ product_name: 'Test Product 2', approval_date: new Date().toISOString() })
        }
      ];

      for (const notification of testNotifications) {
        await connection.execute(`
          INSERT INTO notifications (type, title, message, for_dealer, dealer_id, product_id, order_id, metadata)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          notification.type,
          notification.title,
          notification.message,
          notification.for_dealer,
          notification.dealer_id,
          notification.product_id,
          notification.order_id,
          notification.metadata
        ]);
      }
      
      console.log('✅ Created 3 test notifications for DLR7');
    }

    // Verify the notifications
    console.log('🔍 Verifying notifications...');
    const [verification] = await connection.execute(`
      SELECT id, type, title, message, is_read, created_at
      FROM notifications 
      WHERE dealer_id = ? AND for_dealer = 1 
      ORDER BY created_at DESC
    `, ['DLR7']);
    
    console.log(`📊 Verification: Found ${verification.length} notifications`);
    verification.forEach((notification, index) => {
      console.log(`  ${index + 1}. ${notification.title} (${notification.type}) - ${notification.is_read ? 'Read' : 'Unread'}`);
    });

    console.log('✅ Notifications setup completed successfully!');

  } catch (error) {
    console.error('❌ Notifications setup failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupNotifications()
    .then(() => {
      console.log('🎉 Notifications setup script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Notifications setup script failed:', error);
      process.exit(1);
    });
}

module.exports = { setupNotifications };
