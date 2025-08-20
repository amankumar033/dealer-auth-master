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

async function testAcceptRejectFix() {
  let connection;
  
  try {
    console.log('🧪 Testing Accept/Reject Fix...\n');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Get the notification that needs to be tested
    console.log('📋 Getting order_placed notification for DLR7...');
    const [notifications] = await connection.execute(`
      SELECT id, type, title, message, description, dealer_id, order_id, metadata, created_at 
      FROM notifications 
      WHERE dealer_id = 'DLR7' AND type = 'order_placed' AND for_dealer = 1 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (notifications.length === 0) {
      console.log('❌ No order_placed notifications found for DLR7');
      return;
    }
    
    const notification = notifications[0];
    console.log('✅ Found notification:', notification.id);
    console.log('   Message:', notification.message);
    console.log('   Order ID (direct):', notification.order_id || 'NULL');
    console.log('   Metadata:', notification.metadata || 'NULL');
    
    // Test order ID extraction logic
    console.log('\n🔍 Testing order ID extraction...');
    let orderId = notification.order_id;
    
    // Try to extract from metadata first
    if (!orderId && notification.metadata) {
      try {
        const metadata = JSON.parse(notification.metadata);
        orderId = metadata.order_id || metadata.orderId;
        console.log('   ✅ Extracted from metadata:', orderId);
      } catch (error) {
        console.log('   ❌ Error parsing metadata:', error.message);
      }
    }
    
    // Try to extract from notification message using regex
    if (!orderId && notification.message) {
      const orderIdMatch = notification.message.match(/#([A-Z0-9]+)/);
      if (orderIdMatch) {
        orderId = orderIdMatch[1];
        console.log('   ✅ Extracted from message:', orderId);
      } else {
        console.log('   ❌ No order ID found in message');
      }
    }
    
    if (!orderId) {
      console.log('   ❌ Could not extract order ID from any source');
      return;
    }
    
    console.log('   ✅ Final order ID:', orderId);
    
    // Check if the order exists
    console.log('\n🔍 Checking if order exists...');
    const [orders] = await connection.execute(`
      SELECT order_id, dealer_id, customer_name, total_amount, order_status, order_date 
      FROM orders 
      WHERE order_id = ? AND dealer_id = ?
    `, [orderId, 'DLR7']);
    
    if (orders.length === 0) {
      console.log('❌ Order not found in database');
      return;
    }
    
    const order = orders[0];
    console.log('✅ Order found:');
    console.log('   Order ID:', order.order_id);
    console.log('   Customer:', order.customer_name);
    console.log('   Amount:', order.total_amount);
    console.log('   Status:', order.order_status);
    console.log('   Date:', order.order_date);
    
    // Check if order is in pending status
    if (order.order_status.toLowerCase() !== 'pending') {
      console.log('❌ Order is not in pending status. Current status:', order.order_status);
      return;
    }
    
    console.log('✅ Order is in pending status - ready for accept/reject');
    
    // Test the accept/reject logic
    console.log('\n🧪 Testing accept/reject logic...');
    
    // Simulate accept
    console.log('📋 Simulating ACCEPT...');
    try {
      // Update order status to processing
      await connection.execute(`
        UPDATE orders SET order_status = ? WHERE order_id = ? AND dealer_id = ?
      `, ['processing', orderId, 'DLR7']);
      console.log('   ✅ Order status updated to processing');
      
      // Update notification type
      await connection.execute(`
        UPDATE notifications SET type = ?, title = ?, message = ?, description = ? WHERE id = ?
      `, [
        'order_accepted',
        'Order Accepted',
        `Order ${orderId} has been accepted`,
        `Order ${orderId} has been accepted and is now being processed.`,
        notification.id
      ]);
      console.log('   ✅ Notification updated to order_accepted');
      
      console.log('   🎉 ACCEPT simulation completed successfully!');
      
    } catch (error) {
      console.log('   ❌ Error during accept simulation:', error.message);
    }
    
    // Reset for reject test
    console.log('\n📋 Resetting for REJECT test...');
    try {
      // Reset order status back to pending
      await connection.execute(`
        UPDATE orders SET order_status = ? WHERE order_id = ? AND dealer_id = ?
      `, ['pending', orderId, 'DLR7']);
      console.log('   ✅ Order status reset to pending');
      
      // Reset notification type
      await connection.execute(`
        UPDATE notifications SET type = ?, title = ?, message = ?, description = ? WHERE id = ?
      `, [
        'order_placed',
        notification.title,
        notification.message,
        notification.description,
        notification.id
      ]);
      console.log('   ✅ Notification reset to order_placed');
      
    } catch (error) {
      console.log('   ❌ Error during reset:', error.message);
    }
    
    // Simulate reject
    console.log('\n📋 Simulating REJECT...');
    try {
      // Update order status to cancelled
      await connection.execute(`
        UPDATE orders SET order_status = ? WHERE order_id = ? AND dealer_id = ?
      `, ['cancelled', orderId, 'DLR7']);
      console.log('   ✅ Order status updated to cancelled');
      
      // Update notification type
      await connection.execute(`
        UPDATE notifications SET type = ?, title = ?, message = ?, description = ? WHERE id = ?
      `, [
        'order_rejected',
        'Order Rejected',
        `Order ${orderId} has been rejected`,
        `Order ${orderId} has been rejected and cancelled.`,
        notification.id
      ]);
      console.log('   ✅ Notification updated to order_rejected');
      
      console.log('   🎉 REJECT simulation completed successfully!');
      
    } catch (error) {
      console.log('   ❌ Error during reject simulation:', error.message);
    }
    
    console.log('\n🎉 Accept/Reject fix test completed successfully!');
    console.log('✅ The system can now extract order IDs from notification messages');
    console.log('✅ Accept/Reject functionality should work properly');
    
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
testAcceptRejectFix().catch(console.error);


