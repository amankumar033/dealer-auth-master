const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: '82.29.162.35',
  user: 'kriptocar',
  password: 'kriptocar',
  database: 'kriptocar',
  port: 3306,
  connectTimeout: 10000,
};

async function debugMetadataFormat() {
  let connection;
  
  try {
    console.log('🔍 Debugging Metadata Format...\n');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    const notificationId = 117;
    const dealerId = 'DLR7';
    
    // Get the notification
    console.log('📋 Getting notification...');
    const [notifications] = await connection.execute(`
      SELECT id, type, message, order_id, metadata 
      FROM notifications 
      WHERE id = ? AND dealer_id = ? AND type = ?
    `, [notificationId, dealerId, 'order_placed']);
    
    if (notifications.length === 0) {
      console.log('❌ Notification not found');
      return;
    }
    
    const notification = notifications[0];
    console.log('✅ Notification found:', notification.id);
    console.log('   Type:', notification.type);
    console.log('   Message:', notification.message);
    console.log('   Order ID (direct):', notification.order_id || 'NULL');
    
    // Debug metadata format
    console.log('\n📋 Metadata Analysis:');
    console.log('   Raw metadata type:', typeof notification.metadata);
    console.log('   Raw metadata value:', notification.metadata);
    console.log('   Raw metadata length:', notification.metadata ? notification.metadata.length : 0);
    
    if (notification.metadata) {
      // Try different parsing approaches
      console.log('\n📋 Trying different parsing approaches:');
      
      // Approach 1: Direct JSON.parse
      try {
        const parsed1 = JSON.parse(notification.metadata);
        console.log('   ✅ JSON.parse successful:', parsed1);
      } catch (error) {
        console.log('   ❌ JSON.parse failed:', error.message);
      }
      
      // Approach 2: Check if it's already an object
      if (typeof notification.metadata === 'object') {
        console.log('   ✅ Metadata is already an object:', notification.metadata);
      }
      
      // Approach 3: String manipulation
      if (typeof notification.metadata === 'string') {
        console.log('   📋 Metadata as string:', notification.metadata);
        
        // Try to extract order ID from message as fallback
        const orderIdMatch = notification.message.match(/#([A-Z0-9]+)/);
        if (orderIdMatch) {
          console.log('   ✅ Order ID from message:', orderIdMatch[1]);
        }
      }
    }
    
    // Check if we can extract order ID from message
    console.log('\n📋 Extracting from message:');
    const orderIdMatch = notification.message.match(/#([A-Z0-9]+)/);
    if (orderIdMatch) {
      const orderId = orderIdMatch[1];
      console.log('   ✅ Order ID from message:', orderId);
      
      // Get order details from database
      const [orders] = await connection.execute(`
        SELECT * FROM orders WHERE order_id = ? AND dealer_id = ?
      `, [orderId, dealerId]);
      
      if (orders.length > 0) {
        const order = orders[0];
        console.log('   ✅ Order found in database:');
        console.log('     Order ID:', order.order_id);
        console.log('     Customer:', order.customer_name);
        console.log('     Amount:', order.total_amount);
        console.log('     Status:', order.order_status);
        console.log('     Email:', order.customer_email);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the debug
debugMetadataFormat().catch(console.error);


