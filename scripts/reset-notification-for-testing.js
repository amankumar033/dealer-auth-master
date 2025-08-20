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

async function resetNotificationForTesting() {
  let connection;
  
  try {
    console.log('🔄 Resetting notification for testing...\n');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Reset the notification back to order_placed
    console.log('📋 Resetting notification ID 117 back to order_placed...');
    
    // Reset notification type
    await connection.execute(`
      UPDATE notifications 
      SET type = ?, title = ?, message = ?, description = ? 
      WHERE id = 117
    `, [
      'order_placed',
      'New Order for Your Products',
      'A new order #ORD121010101 has been placed for your products by ns Kumar for $91.98.',
      'New order received. Please review and accept or reject.'
    ]);
    console.log('✅ Notification reset to order_placed');
    
    // Reset order status back to pending
    await connection.execute(`
      UPDATE orders 
      SET order_status = ? 
      WHERE order_id = 'ORD121010101' AND dealer_id = 'DLR7'
    `, ['pending']);
    console.log('✅ Order status reset to pending');
    
    // Verify the reset
    console.log('\n📋 Verifying reset...');
    const [notifications] = await connection.execute(`
      SELECT id, type, title, message, description 
      FROM notifications 
      WHERE id = 117
    `);
    
    if (notifications.length > 0) {
      const notification = notifications[0];
      console.log('✅ Notification reset successful:');
      console.log('   ID:', notification.id);
      console.log('   Type:', notification.type);
      console.log('   Title:', notification.title);
      console.log('   Message:', notification.message);
      console.log('   Description:', notification.description);
    }
    
    const [orders] = await connection.execute(`
      SELECT order_id, order_status 
      FROM orders 
      WHERE order_id = 'ORD121010101' AND dealer_id = 'DLR7'
    `);
    
    if (orders.length > 0) {
      const order = orders[0];
      console.log('✅ Order reset successful:');
      console.log('   Order ID:', order.order_id);
      console.log('   Status:', order.order_status);
    }
    
    console.log('\n🎉 Reset completed successfully!');
    console.log('✅ You can now test the Accept/Reject buttons in the UI');
    console.log('✅ The notification should show Accept/Reject buttons');
    
  } catch (error) {
    console.error('❌ Reset failed:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the reset
resetNotificationForTesting().catch(console.error);


