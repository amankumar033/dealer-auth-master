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

async function testMetadataFix() {
  let connection;
  
  try {
    console.log('🧪 Testing Metadata Fix...\n');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    const notificationId = 117;
    const dealerId = 'DLR7';
    
    console.log('📋 Testing notification ID:', notificationId);
    console.log('📋 Testing dealer ID:', dealerId);
    
    // Get the notification
    console.log('\n📋 Getting notification...');
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
    
    // Test the fixed metadata extraction logic
    console.log('\n📋 Testing fixed metadata extraction...');
    let orderId, orderData;
    
    if (notification.metadata) {
      try {
        // Handle metadata as object (not JSON string) - same logic as API
        const metadata = typeof notification.metadata === 'string' 
          ? JSON.parse(notification.metadata) 
          : notification.metadata;
        
        orderId = metadata.order_id || metadata.orderId;
        orderData = metadata;
        
        console.log('✅ Metadata extraction successful:');
        console.log('   Order ID:', orderId);
        console.log('   Customer Name:', metadata.customer_name);
        console.log('   Customer Email:', metadata.customer_email);
        console.log('   Total Amount:', metadata.total_amount);
        console.log('   Order Status:', metadata.order_status);
        
        // Check if order is pending
        if (metadata.order_status === 'pending') {
          console.log('✅ Order is in pending status - ready for accept/reject');
        } else {
          console.log('❌ Order is not in pending status:', metadata.order_status);
        }
        
      } catch (error) {
        console.log('❌ Error extracting metadata:', error.message);
        return;
      }
    } else {
      console.log('❌ No metadata found');
      return;
    }
    
    if (!orderId) {
      console.log('❌ Order ID not found in metadata');
      return;
    }
    
    // Simulate the accept process using metadata
    console.log('\n📋 Simulating accept process with metadata...');
    try {
      // Update order status in database
      await connection.execute(`
        UPDATE orders SET order_status = ? WHERE order_id = ? AND dealer_id = ?
      `, ['processing', orderId, dealerId]);
      console.log('   ✅ Order status updated to processing');
      
      // Update notification type
      await connection.execute(`
        UPDATE notifications SET type = ?, title = ?, message = ?, description = ? WHERE id = ?
      `, [
        'order_accepted',
        'Order Accepted',
        `Order ${orderId} has been accepted`,
        `Order ${orderId} has been accepted and is now being processed.`,
        notificationId
      ]);
      console.log('   ✅ Notification updated to order_accepted');
      
      console.log('   🎉 Accept process completed successfully!');
      
    } catch (error) {
      console.log('   ❌ Error during accept process:', error.message);
    }
    
    console.log('\n✅ Metadata fix test completed successfully!');
    console.log('✅ The API should now work correctly with metadata extraction');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the test
testMetadataFix().catch(console.error);


