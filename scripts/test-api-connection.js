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

async function testApiConnection() {
  let connection;
  
  try {
    console.log('🧪 Testing API Database Connection...\n');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');
    
    const notificationId = 117;
    const dealerId = 'DLR7';
    
    console.log('📋 Testing notification ID:', notificationId);
    console.log('📋 Testing dealer ID:', dealerId);
    
    // Test the exact same query as the API
    console.log('\n📋 Testing API query...');
    const [notifications] = await connection.execute(`
      SELECT * FROM notifications WHERE id = ? AND dealer_id = ? AND type = ?
    `, [notificationId, dealerId, 'order_placed']);
    
    if (notifications.length === 0) {
      console.log('❌ Notification not found in database');
      console.log('   This means the API will also fail to find it');
      return;
    }
    
    const notification = notifications[0];
    console.log('✅ Notification found in database:');
    console.log('   ID:', notification.id);
    console.log('   Type:', notification.type);
    console.log('   Dealer ID:', notification.dealer_id);
    console.log('   Has Metadata:', !!notification.metadata);
    
    if (notification.metadata) {
      console.log('   Metadata Type:', typeof notification.metadata);
      console.log('   Metadata Keys:', Object.keys(notification.metadata));
    }
    
    console.log('\n✅ Database connection test successful!');
    console.log('✅ The API should be able to find this notification');
    console.log('✅ Accept/Reject functionality should work');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('❌ This means your API will also fail');
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the test
testApiConnection().catch(console.error);


