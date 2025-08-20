const mysql = require('mysql2/promise');

const dbConfig = {
  host: '82.29.162.35',
  user: 'kriptocar',
  password: 'kriptocar',
  database: 'kriptocar',
  port: 3306,
  connectTimeout: 10000,
};

async function quickCheckNotifications() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Check total notifications
    const [count] = await connection.execute('SELECT COUNT(*) as count FROM notifications');
    console.log(`📊 Total notifications: ${count[0].count}`);
    
    if (count[0].count > 0) {
      // Show all notifications
      const [notifications] = await connection.execute('SELECT * FROM notifications ORDER BY created_at DESC');
      console.log('\n📋 All notifications:');
      notifications.forEach((notification, index) => {
        console.log(`${index + 1}. ID: ${notification.id} | Type: ${notification.type} | Dealer: ${notification.dealer_id}`);
        console.log(`   Title: ${notification.title}`);
        console.log(`   For: Admin(${notification.for_admin}) Dealer(${notification.for_dealer}) User(${notification.for_user}) Vendor(${notification.for_vendor})`);
        console.log('─'.repeat(80));
      });
    } else {
      console.log('✅ No notifications found - database is clean!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

quickCheckNotifications();
