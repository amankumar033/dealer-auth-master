const mysql = require('mysql2/promise');

// Database configuration - same as your .env.local
const dbConfig = {
  host: '82.29.162.35',
  user: 'kriptocar',
  password: 'kriptocar',
  database: 'kriptocar',
  port: 3306,
  connectTimeout: 10000,
};

async function debugApiIssue() {
  let connection;
  
  try {
    console.log('🔍 Comprehensive API Debug...\n');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');
    
    const notificationId = 117;
    const dealerId = 'DLR7';
    
    console.log('📋 Debug Parameters:');
    console.log('   Notification ID:', notificationId);
    console.log('   Dealer ID:', dealerId);
    
    // Step 1: Check if notification exists
    console.log('\n📋 Step 1: Check notification exists...');
    const [notifications] = await connection.execute(`
      SELECT * FROM notifications WHERE id = ? AND dealer_id = ? AND type = ?
    `, [notificationId, dealerId, 'order_placed']);
    
    if (notifications.length === 0) {
      console.log('❌ Notification not found!');
      console.log('   This is why the API is failing.');
      
      // Check what notifications exist for this dealer
      const [allNotifications] = await connection.execute(`
        SELECT id, type, dealer_id FROM notifications WHERE dealer_id = ?
      `, [dealerId]);
      
      console.log('   Available notifications for DLR7:');
      allNotifications.forEach(n => {
        console.log(`     ID: ${n.id}, Type: ${n.type}`);
      });
      return;
    }
    
    const notification = notifications[0];
    console.log('✅ Notification found:');
    console.log('   ID:', notification.id);
    console.log('   Type:', notification.type);
    console.log('   Dealer ID:', notification.dealer_id);
    console.log('   Has Metadata:', !!notification.metadata);
    
    // Step 2: Check metadata
    console.log('\n📋 Step 2: Check metadata...');
    if (!notification.metadata) {
      console.log('❌ No metadata found!');
      return;
    }
    
    console.log('   Metadata Type:', typeof notification.metadata);
    console.log('   Metadata Keys:', Object.keys(notification.metadata));
    
    // Step 3: Test metadata extraction
    console.log('\n📋 Step 3: Test metadata extraction...');
    let orderId, orderData;
    
    try {
      // Handle metadata as object (same logic as API)
      const metadata = typeof notification.metadata === 'string' 
        ? JSON.parse(notification.metadata) 
        : notification.metadata;
      
      orderId = metadata.order_id || metadata.orderId;
      orderData = metadata;
      
      console.log('✅ Metadata extraction successful:');
      console.log('   Order ID:', orderId);
      console.log('   Customer Name:', metadata.customer_name);
      console.log('   Customer Email:', metadata.customer_email);
      console.log('   Order Status:', metadata.order_status);
      console.log('   Total Amount:', metadata.total_amount);
      
    } catch (error) {
      console.log('❌ Metadata extraction failed:', error.message);
      return;
    }
    
    if (!orderId) {
      console.log('❌ Order ID not found in metadata!');
      return;
    }
    
    // Step 4: Check order status
    console.log('\n📋 Step 4: Check order status...');
    const orderStatus = orderData.order_status;
    console.log('   Order Status:', orderStatus);
    
    if (orderStatus.toLowerCase() !== 'pending') {
      console.log('❌ Order is not in pending status!');
      console.log('   Current status:', orderStatus);
      console.log('   Expected: pending (case insensitive)');
      return;
    }
    
    console.log('✅ Order is in pending status');
    
    // Step 5: Test database updates
    console.log('\n📋 Step 5: Test database updates...');
    try {
      // Test order status update
      await connection.execute(`
        UPDATE orders SET order_status = ? WHERE order_id = ? AND dealer_id = ?
      `, ['processing', orderId, dealerId]);
      console.log('✅ Order status update successful');
      
      // Test notification update
      await connection.execute(`
        UPDATE notifications SET type = ?, title = ?, message = ?, description = ? WHERE id = ?
      `, [
        'order_accepted',
        'Order Accepted',
        `Order ${orderId} has been accepted`,
        `Order ${orderId} has been accepted and is now being processed.`,
        notificationId
      ]);
      console.log('✅ Notification update successful');
      
      console.log('🎉 All database operations successful!');
      
    } catch (error) {
      console.log('❌ Database update failed:', error.message);
      return;
    }
    
    console.log('\n✅ Debug completed successfully!');
    console.log('✅ All components are working correctly');
    console.log('✅ The issue might be in the API route or Next.js configuration');
    
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
debugApiIssue().catch(console.error);


