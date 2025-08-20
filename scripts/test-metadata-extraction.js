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

async function testMetadataExtraction() {
  let connection;
  
  try {
    console.log('🧪 Testing Metadata Extraction...\n');
    
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
    console.log('   Type:', notification.type);
    console.log('   Message:', notification.message);
    console.log('   Order ID (direct):', notification.order_id || 'NULL');
    console.log('   Metadata:', notification.metadata || 'NULL');
    
    // Test metadata extraction
    console.log('\n📋 Testing metadata extraction...');
    let orderId, orderData;
    
    if (notification.metadata) {
      try {
        const metadata = JSON.parse(notification.metadata);
        orderId = metadata.order_id || metadata.orderId;
        orderData = metadata;
        
        console.log('✅ Metadata parsed successfully:');
        console.log('   Order ID:', orderId);
        console.log('   Customer Name:', metadata.customer_name);
        console.log('   Customer Email:', metadata.customer_email);
        console.log('   Total Amount:', metadata.total_amount);
        console.log('   Order Status:', metadata.order_status);
        console.log('   Order Date:', metadata.order_date);
        console.log('   Payment Status:', metadata.payment_status);
        console.log('   Shipping Address:', metadata.shipping_address);
        console.log('   Shipping Pincode:', metadata.shipping_pincode);
        
        // Check if order is pending
        if (metadata.order_status === 'pending') {
          console.log('✅ Order is in pending status - ready for accept/reject');
        } else {
          console.log('❌ Order is not in pending status:', metadata.order_status);
        }
        
      } catch (error) {
        console.log('❌ Error parsing metadata:', error.message);
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
    
    console.log('\n✅ Metadata extraction test completed successfully!');
    console.log('✅ All order information can be extracted from metadata');
    
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
testMetadataExtraction().catch(console.error);


