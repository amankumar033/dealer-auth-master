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

async function testNotificationSystem() {
  let connection;
  
  try {
    console.log('🔔 Testing Complete Notification System...\n');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Test 1: Check notification table structure
    console.log('\n📋 Test 1: Checking notification table structure...');
    const [columns] = await connection.execute('DESCRIBE notifications');
    console.log('✅ Table columns:', columns.map(col => col.Field));
    
    // Check if description column exists
    const hasDescription = columns.some(col => col.Field === 'description');
    console.log('✅ Description column exists:', hasDescription);
    
    // Test 2: Check notification types
    console.log('\n📋 Test 2: Checking notification types...');
    const [typeInfo] = await connection.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'kriptocar' 
      AND TABLE_NAME = 'notifications' 
      AND COLUMN_NAME = 'type'
    `);
    console.log('✅ Notification types:', typeInfo[0]?.COLUMN_TYPE);
    
    // Test 3: Check existing notifications
    console.log('\n📋 Test 3: Checking existing notifications...');
    const [notifications] = await connection.execute('SELECT COUNT(*) as count FROM notifications');
    console.log('✅ Total notifications:', notifications[0].count);
    
    if (notifications[0].count > 0) {
      const [allNotifications] = await connection.execute(`
        SELECT id, type, title, message, description, dealer_id, order_id, created_at 
        FROM notifications 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      console.log('\n📋 Recent notifications:');
      allNotifications.forEach((notification, index) => {
        console.log(`${index + 1}. ID: ${notification.id} | Type: ${notification.type}`);
        console.log(`   Title: ${notification.title}`);
        console.log(`   Message: ${notification.message}`);
        console.log(`   Description: ${notification.description || 'N/A'}`);
        console.log(`   Dealer: ${notification.dealer_id} | Order: ${notification.order_id || 'N/A'}`);
        console.log(`   Created: ${notification.created_at}`);
        console.log('─'.repeat(80));
      });
    }
    
    // Test 4: Check notifications for dealer DLR7
    console.log('\n📋 Test 4: Checking notifications for dealer DLR7...');
    const [dealerNotifications] = await connection.execute(`
      SELECT id, type, title, message, description, order_id, created_at 
      FROM notifications 
      WHERE dealer_id = 'DLR7' AND for_dealer = 1 
      ORDER BY created_at DESC
    `);
    console.log('✅ DLR7 notifications:', dealerNotifications.length);
    
    if (dealerNotifications.length > 0) {
      console.log('\n📋 DLR7 notifications:');
      dealerNotifications.forEach((notification, index) => {
        console.log(`${index + 1}. ID: ${notification.id} | Type: ${notification.type}`);
        console.log(`   Title: ${notification.title}`);
        console.log(`   Message: ${notification.message}`);
        console.log(`   Description: ${notification.description || 'N/A'}`);
        console.log(`   Order: ${notification.order_id || 'N/A'}`);
        console.log('─'.repeat(60));
      });
    }
    
    // Test 5: Check for order_placed notifications
    console.log('\n📋 Test 5: Checking for order_placed notifications...');
    const [orderPlacedNotifications] = await connection.execute(`
      SELECT id, type, title, message, description, dealer_id, order_id, created_at 
      FROM notifications 
      WHERE type = 'order_placed' AND for_dealer = 1 
      ORDER BY created_at DESC
    `);
    console.log('✅ Order placed notifications:', orderPlacedNotifications.length);
    
    if (orderPlacedNotifications.length > 0) {
      console.log('\n📋 Order placed notifications:');
      orderPlacedNotifications.forEach((notification, index) => {
        console.log(`${index + 1}. ID: ${notification.id} | Dealer: ${notification.dealer_id}`);
        console.log(`   Order ID: ${notification.order_id}`);
        console.log(`   Title: ${notification.title}`);
        console.log(`   Message: ${notification.message}`);
        console.log(`   Description: ${notification.description || 'N/A'}`);
        console.log('─'.repeat(60));
      });
    }
    
    // Test 6: Check for order_accepted and order_rejected notifications
    console.log('\n📋 Test 6: Checking for order_accepted and order_rejected notifications...');
    const [processedNotifications] = await connection.execute(`
      SELECT id, type, title, message, description, dealer_id, order_id, created_at 
      FROM notifications 
      WHERE type IN ('order_accepted', 'order_rejected') AND for_dealer = 1 
      ORDER BY created_at DESC
    `);
    console.log('✅ Processed order notifications:', processedNotifications.length);
    
    if (processedNotifications.length > 0) {
      console.log('\n📋 Processed order notifications:');
      processedNotifications.forEach((notification, index) => {
        console.log(`${index + 1}. ID: ${notification.id} | Type: ${notification.type}`);
        console.log(`   Dealer: ${notification.dealer_id} | Order: ${notification.order_id}`);
        console.log(`   Title: ${notification.title}`);
        console.log(`   Message: ${notification.message}`);
        console.log(`   Description: ${notification.description || 'N/A'}`);
        console.log('─'.repeat(60));
      });
    }
    
    // Test 7: Check orders table for corresponding orders
    console.log('\n📋 Test 7: Checking orders table...');
    const [orders] = await connection.execute(`
      SELECT order_id, dealer_id, order_status, customer_name, total_amount, order_date 
      FROM orders 
      WHERE dealer_id = 'DLR7' 
      ORDER BY order_date DESC 
      LIMIT 5
    `);
    console.log('✅ DLR7 orders:', orders.length);
    
    if (orders.length > 0) {
      console.log('\n📋 Recent orders:');
      orders.forEach((order, index) => {
        console.log(`${index + 1}. Order ID: ${order.order_id}`);
        console.log(`   Status: ${order.order_status}`);
        console.log(`   Customer: ${order.customer_name}`);
        console.log(`   Amount: ₹${order.total_amount}`);
        console.log(`   Created: ${order.order_date}`);
        console.log('─'.repeat(60));
      });
    }
    
    console.log('\n🎉 Notification system test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Total notifications: ${notifications[0].count}`);
    console.log(`   - DLR7 notifications: ${dealerNotifications.length}`);
    console.log(`   - Order placed notifications: ${orderPlacedNotifications.length}`);
    console.log(`   - Processed order notifications: ${processedNotifications.length}`);
    console.log(`   - DLR7 orders: ${orders.length}`);
    
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
testNotificationSystem().catch(console.error);
