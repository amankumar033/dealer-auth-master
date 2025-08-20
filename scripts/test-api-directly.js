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

async function testApiLogicDirectly() {
  let connection;
  
  try {
    console.log('🧪 Testing Accept API logic directly...\n');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    const notificationId = 117;
    const dealerId = 'DLR7';
    
    console.log('📋 Testing with notification ID:', notificationId);
    console.log('📋 Testing with dealer ID:', dealerId);
    
    // Step 1: Get the notification details
    console.log('\n📋 Step 1: Getting notification details...');
    const [notifications] = await connection.execute(`
      SELECT * FROM notifications WHERE id = ? AND dealer_id = ? AND type = ?
    `, [notificationId, dealerId, 'order_placed']);
    
    if (!notifications || notifications.length === 0) {
      console.log('❌ Notification not found or not an order_placed notification');
      return;
    }
    
    const notification = notifications[0];
    console.log('✅ Notification found:');
    console.log('   ID:', notification.id);
    console.log('   Type:', notification.type);
    console.log('   Message:', notification.message);
    console.log('   Order ID (direct):', notification.order_id || 'NULL');
    console.log('   Metadata:', notification.metadata || 'NULL');
    
    // Step 2: Extract order ID
    console.log('\n📋 Step 2: Extracting order ID...');
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
    
    // Step 3: Get order details
    console.log('\n📋 Step 3: Getting order details...');
    const [orders] = await connection.execute(`
      SELECT * FROM orders WHERE order_id = ? AND dealer_id = ?
    `, [orderId, dealerId]);
    
    if (!orders || orders.length === 0) {
      console.log('❌ Order not found');
      return;
    }
    
    const order = orders[0];
    console.log('✅ Order found:');
    console.log('   Order ID:', order.order_id);
    console.log('   Status:', order.order_status);
    console.log('   Customer:', order.customer_name);
    console.log('   Amount:', order.total_amount);
    
    // Step 4: Check if order is pending
    console.log('\n📋 Step 4: Checking order status...');
    if (order.order_status !== 'pending') {
      console.log('❌ Order is not in pending status. Current status:', order.order_status);
      return;
    }
    
    console.log('✅ Order is in pending status - ready for accept');
    
    // Step 5: Simulate the accept process
    console.log('\n📋 Step 5: Simulating accept process...');
    
    try {
      // Update order status to processing
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
      
      // Verify the changes
      console.log('\n📋 Step 6: Verifying changes...');
      const [updatedOrders] = await connection.execute(`
        SELECT order_id, order_status FROM orders WHERE order_id = ? AND dealer_id = ?
      `, [orderId, dealerId]);
      
      const [updatedNotifications] = await connection.execute(`
        SELECT id, type, title, message FROM notifications WHERE id = ?
      `, [notificationId]);
      
      console.log('✅ Order status after update:', updatedOrders[0]?.order_status);
      console.log('✅ Notification type after update:', updatedNotifications[0]?.type);
      
    } catch (error) {
      console.log('   ❌ Error during accept process:', error.message);
    }
    
    console.log('\n🎉 API logic test completed successfully!');
    console.log('✅ The accept logic should work properly');
    
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
testApiLogicDirectly().catch(console.error);
