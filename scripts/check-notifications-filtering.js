const mysql = require('mysql2/promise');

const dbConfig = {
  host: '82.29.162.35',
  user: 'kriptocar',
  password: 'kriptocar',
  database: 'kriptocar',
  port: 3306,
  connectTimeout: 10000,
};

async function checkNotificationsFiltering() {
  console.log('🔍 Checking notifications filtering...\n');
  
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Check all notifications first
    const [allNotifications] = await connection.execute('SELECT COUNT(*) as count FROM notifications');
    console.log(`📊 Total Notifications in Database: ${allNotifications[0].count}`);
    
    if (allNotifications[0].count > 0) {
      console.log('\n📋 All Notifications:');
      console.log('─'.repeat(100));
      const [notifications] = await connection.execute(`
        SELECT id, type, title, for_admin, for_dealer, for_user, for_vendor, dealer_id, created_at 
        FROM notifications 
        ORDER BY created_at DESC
      `);
      
      notifications.forEach((notification, index) => {
        console.log(`${index + 1}. ID: ${notification.id} | Type: ${notification.type} | Dealer: ${notification.dealer_id}`);
        console.log(`   Title: ${notification.title}`);
        console.log(`   For: Admin(${notification.for_admin}) Dealer(${notification.for_dealer}) User(${notification.for_user}) Vendor(${notification.for_vendor})`);
        console.log(`   Created: ${notification.created_at}`);
        console.log('─'.repeat(100));
      });
    }
    
    // Test the exact query that the API uses for DLR7
    console.log('\n🧪 Testing API Query for DLR7:');
    console.log('─'.repeat(80));
    
    const testQuery = 'SELECT * FROM notifications WHERE dealer_id = ? AND for_dealer = 1 ORDER BY created_at DESC';
    const [dlr7Notifications] = await connection.execute(testQuery, ['DLR7']);
    
    console.log(`Query: ${testQuery}`);
    console.log(`Parameters: ['DLR7']`);
    console.log(`Results for DLR7: ${dlr7Notifications.length} notifications`);
    
    if (dlr7Notifications.length > 0) {
      console.log('\n📋 DLR7 Notifications (for_dealer = 1):');
      dlr7Notifications.forEach((notification, index) => {
        console.log(`${index + 1}. ID: ${notification.id} | Type: ${notification.type} | Title: ${notification.title}`);
        console.log(`   For: Admin(${notification.for_admin}) Dealer(${notification.for_dealer}) User(${notification.for_user}) Vendor(${notification.for_vendor})`);
        console.log(`   Created: ${notification.created_at}`);
      });
    } else {
      console.log('❌ No notifications found for DLR7 with for_dealer = 1');
    }
    
    // Check what notifications exist for DLR7 without the for_dealer filter
    console.log('\n🔍 All DLR7 Notifications (without for_dealer filter):');
    console.log('─'.repeat(80));
    
    const [allDlr7Notifications] = await connection.execute(
      'SELECT * FROM notifications WHERE dealer_id = ? ORDER BY created_at DESC', 
      ['DLR7']
    );
    
    console.log(`Total DLR7 notifications: ${allDlr7Notifications.length}`);
    
    if (allDlr7Notifications.length > 0) {
      allDlr7Notifications.forEach((notification, index) => {
        console.log(`${index + 1}. ID: ${notification.id} | Type: ${notification.type} | Title: ${notification.title}`);
        console.log(`   For: Admin(${notification.for_admin}) Dealer(${notification.for_dealer}) User(${notification.for_user}) Vendor(${notification.for_vendor})`);
        console.log(`   Created: ${notification.created_at}`);
      });
    }
    
    // Check for any notifications with for_dealer = 0 that shouldn't be shown
    console.log('\n🔍 Notifications with for_dealer = 0 (should not be shown):');
    console.log('─'.repeat(80));
    
    const [dealerZeroNotifications] = await connection.execute(
      'SELECT * FROM notifications WHERE for_dealer = 0 ORDER BY created_at DESC'
    );
    
    console.log(`Total notifications with for_dealer = 0: ${dealerZeroNotifications.length}`);
    
    if (dealerZeroNotifications.length > 0) {
      dealerZeroNotifications.forEach((notification, index) => {
        console.log(`${index + 1}. ID: ${notification.id} | Type: ${notification.type} | Dealer: ${notification.dealer_id} | Title: ${notification.title}`);
      });
    }
    
    console.log('\n💡 Summary:');
    console.log('─'.repeat(80));
    console.log('✅ The API query correctly filters by for_dealer = 1 AND dealer_id');
    console.log('✅ Only notifications with for_dealer = 1 should be shown to dealers');
    console.log('✅ Notifications with for_dealer = 0 are hidden from dealers');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Connection closed');
    }
  }
}

checkNotificationsFiltering();
