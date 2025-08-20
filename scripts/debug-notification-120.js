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

async function debugNotification120() {
  let connection;
  
  try {
    console.log('🔍 Debugging Notification ID 120...\n');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');
    
    const notificationId = 120;
    const dealerId = 'DLR7';
    
    console.log('📋 Parameters:');
    console.log('   Notification ID:', notificationId);
    console.log('   Dealer ID:', dealerId);
    
    // Check if notification exists at all
    console.log('\n📋 Step 1: Check if notification exists...');
    const [allNotifications] = await connection.execute(`
      SELECT id, type, dealer_id FROM notifications WHERE id = ?
    `, [notificationId]);
    
    if (allNotifications.length === 0) {
      console.log('❌ Notification ID 120 does not exist in database!');
      return;
    }
    
    const notification = allNotifications[0];
    console.log('✅ Notification 120 exists:');
    console.log('   ID:', notification.id);
    console.log('   Type:', notification.type);
    console.log('   Dealer ID:', notification.dealer_id);
    
    // Check the exact query that's failing
    console.log('\n📋 Step 2: Test the exact API query...');
    const [apiQueryResult] = await connection.execute(`
      SELECT * FROM notifications WHERE id = ? AND dealer_id = ? AND type = ?
    `, [notificationId, dealerId, 'order_placed']);
    
    console.log('   API Query Result Length:', apiQueryResult.length);
    
    if (apiQueryResult.length === 0) {
      console.log('❌ API query returns no results!');
      console.log('   This means one of these conditions is not met:');
      console.log('   - id = 120');
      console.log('   - dealer_id = DLR7');
      console.log('   - type = order_placed');
      
      // Check what the actual values are
      console.log('\n📋 Step 3: Check actual values...');
      const [actualNotification] = await connection.execute(`
        SELECT id, type, dealer_id FROM notifications WHERE id = ?
      `, [notificationId]);
      
      if (actualNotification.length > 0) {
        const actual = actualNotification[0];
        console.log('   Actual values:');
        console.log('     ID:', actual.id);
        console.log('     Type:', actual.type);
        console.log('     Dealer ID:', actual.dealer_id);
        
        if (actual.dealer_id !== dealerId) {
          console.log('   ❌ Dealer ID mismatch!');
          console.log('     Expected: DLR7');
          console.log('     Actual:', actual.dealer_id);
        }
        
        if (actual.type !== 'order_placed') {
          console.log('   ❌ Type mismatch!');
          console.log('     Expected: order_placed');
          console.log('     Actual:', actual.type);
        }
      }
    } else {
      console.log('✅ API query should work!');
      console.log('   Found notification:', apiQueryResult[0]);
    }
    
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
debugNotification120().catch(console.error);


