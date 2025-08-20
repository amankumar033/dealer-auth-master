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

async function debugNotificationMetadata() {
  let connection;
  
  try {
    console.log('🔍 Debugging notification metadata...\n');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Get order_placed notifications for DLR7
    console.log('📋 Checking order_placed notifications for DLR7...');
    const [notifications] = await connection.execute(`
      SELECT id, type, title, message, description, dealer_id, order_id, metadata, created_at 
      FROM notifications 
      WHERE dealer_id = 'DLR7' AND type = 'order_placed' AND for_dealer = 1 
      ORDER BY created_at DESC
    `);
    
    console.log('✅ Found notifications:', notifications.length);
    
    if (notifications.length > 0) {
      notifications.forEach((notification, index) => {
        console.log(`\n📋 Notification ${index + 1}:`);
        console.log(`   ID: ${notification.id}`);
        console.log(`   Type: ${notification.type}`);
        console.log(`   Title: ${notification.title}`);
        console.log(`   Message: ${notification.message}`);
        console.log(`   Description: ${notification.description || 'N/A'}`);
        console.log(`   Dealer ID: ${notification.dealer_id}`);
        console.log(`   Order ID (direct): ${notification.order_id || 'NULL'}`);
        console.log(`   Metadata: ${notification.metadata || 'NULL'}`);
        
        // Parse metadata if available
        if (notification.metadata) {
          try {
            const metadata = JSON.parse(notification.metadata);
            console.log(`   Parsed Metadata:`);
            Object.keys(metadata).forEach(key => {
              console.log(`     ${key}: ${metadata[key]}`);
            });
            
            // Extract order ID from metadata
            const orderIdFromMetadata = metadata.order_id || metadata.orderId;
            console.log(`   Order ID from metadata: ${orderIdFromMetadata || 'NOT FOUND'}`);
            
            // Check if order exists
            if (orderIdFromMetadata) {
              console.log(`   ✅ Order ID found in metadata: ${orderIdFromMetadata}`);
            } else {
              console.log(`   ❌ No order ID found in metadata`);
            }
            
          } catch (error) {
            console.log(`   ❌ Error parsing metadata: ${error.message}`);
          }
        }
        
        console.log('─'.repeat(80));
      });
    }
    
    // Check if there are any orders that match the notification message
    console.log('\n🔍 Checking for orders mentioned in notifications...');
    const [orders] = await connection.execute(`
      SELECT order_id, dealer_id, customer_name, total_amount, order_status, order_date 
      FROM orders 
      WHERE dealer_id = 'DLR7' 
      ORDER BY order_date DESC 
      LIMIT 5
    `);
    
    console.log('✅ Found orders:', orders.length);
    orders.forEach((order, index) => {
      console.log(`\n📦 Order ${index + 1}:`);
      console.log(`   Order ID: ${order.order_id}`);
      console.log(`   Customer: ${order.customer_name}`);
      console.log(`   Amount: ₹${order.total_amount}`);
      console.log(`   Status: ${order.order_status}`);
      console.log(`   Date: ${order.order_date}`);
    });
    
    // Try to match notifications with orders
    console.log('\n🔍 Attempting to match notifications with orders...');
    if (notifications.length > 0 && orders.length > 0) {
      const notification = notifications[0];
      const order = orders[0];
      
      console.log(`\n📋 Matching attempt:`);
      console.log(`   Notification message: ${notification.message}`);
      console.log(`   Order ID: ${order.order_id}`);
      console.log(`   Customer: ${order.customer_name}`);
      console.log(`   Amount: ₹${order.total_amount}`);
      
      // Check if order ID appears in notification message
      if (notification.message.includes(order.order_id)) {
        console.log(`   ✅ Order ID ${order.order_id} found in notification message`);
      } else {
        console.log(`   ❌ Order ID ${order.order_id} NOT found in notification message`);
      }
      
      // Check if customer name appears in notification message
      if (notification.message.includes(order.customer_name)) {
        console.log(`   ✅ Customer name ${order.customer_name} found in notification message`);
      } else {
        console.log(`   ❌ Customer name ${order.customer_name} NOT found in notification message`);
      }
      
      // Check if amount appears in notification message
      if (notification.message.includes(order.total_amount.toString())) {
        console.log(`   ✅ Amount ₹${order.total_amount} found in notification message`);
      } else {
        console.log(`   ❌ Amount ₹${order.total_amount} NOT found in notification message`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the debug
debugNotificationMetadata().catch(console.error);


