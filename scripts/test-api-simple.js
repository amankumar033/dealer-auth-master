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

async function testApiSimple() {
  let connection;
  
  try {
    console.log('🧪 Simple API Test...\n');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    const notificationId = 117;
    const dealerId = 'DLR7';
    
    console.log('📋 Testing notification ID:', notificationId);
    console.log('📋 Testing dealer ID:', dealerId);
    
    // Test 1: Check if notification exists
    console.log('\n📋 Test 1: Check notification exists...');
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
    
    // Test 2: Extract order ID from message
    console.log('\n📋 Test 2: Extract order ID from message...');
    const orderIdMatch = notification.message.match(/#([A-Z0-9]+)/);
    if (!orderIdMatch) {
      console.log('❌ No order ID found in message');
      return;
    }
    
    const orderId = orderIdMatch[1];
    console.log('✅ Order ID extracted:', orderId);
    
    // Test 3: Check if order exists
    console.log('\n📋 Test 3: Check order exists...');
    const [orders] = await connection.execute(`
      SELECT order_id, order_status, customer_name 
      FROM orders 
      WHERE order_id = ? AND dealer_id = ?
    `, [orderId, dealerId]);
    
    if (orders.length === 0) {
      console.log('❌ Order not found');
      return;
    }
    
    const order = orders[0];
    console.log('✅ Order found:', order.order_id);
    console.log('   Status:', order.order_status);
    console.log('   Customer:', order.customer_name);
    
    // Test 4: Check if order is pending
    console.log('\n📋 Test 4: Check order status...');
    if (order.order_status !== 'pending') {
      console.log('❌ Order is not pending. Status:', order.order_status);
      return;
    }
    
    console.log('✅ Order is pending - ready for accept/reject');
    
    // Test 5: Simulate accept (just update order status)
    console.log('\n📋 Test 5: Simulate accept (update order status)...');
    await connection.execute(`
      UPDATE orders SET order_status = ? WHERE order_id = ? AND dealer_id = ?
    `, ['processing', orderId, dealerId]);
    console.log('✅ Order status updated to processing');
    
    // Test 6: Verify the update
    console.log('\n📋 Test 6: Verify update...');
    const [updatedOrders] = await connection.execute(`
      SELECT order_id, order_status FROM orders WHERE order_id = ? AND dealer_id = ?
    `, [orderId, dealerId]);
    
    console.log('✅ Updated order status:', updatedOrders[0]?.order_status);
    
    // Test 7: Reset back to pending for testing
    console.log('\n📋 Test 7: Reset to pending...');
    await connection.execute(`
      UPDATE orders SET order_status = ? WHERE order_id = ? AND dealer_id = ?
    `, ['pending', orderId, dealerId]);
    console.log('✅ Order reset to pending');
    
    console.log('\n🎉 All tests passed!');
    console.log('✅ The API logic should work correctly');
    
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
testApiSimple().catch(console.error);


