const mysql = require('mysql2/promise');

async function testNotificationDeletion() {
  let connection;
  
  try {
    // Database connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'dealer_auth_db'
    });

    console.log('🔔 Testing notification deletion...');

    // First, let's see what notifications exist
    const [notifications] = await connection.execute(
      'SELECT id, title, message, dealer_id FROM notifications ORDER BY created_at DESC LIMIT 5'
    );

    console.log('📋 Current notifications:');
    notifications.forEach(notification => {
      console.log(`  - ID: ${notification.id}, Title: ${notification.title}, Dealer: ${notification.dealer_id}`);
    });

    if (notifications.length === 0) {
      console.log('❌ No notifications found to test deletion');
      return;
    }

    // Test deletion of the first notification
    const testNotificationId = notifications[0].id;
    console.log(`\n🗑️ Testing deletion of notification ID: ${testNotificationId}`);

    // Delete the notification
    const [deleteResult] = await connection.execute(
      'DELETE FROM notifications WHERE id = ?',
      [testNotificationId]
    );

    console.log(`✅ Deletion result: ${deleteResult.affectedRows} row(s) affected`);

    // Verify deletion
    const [remainingNotifications] = await connection.execute(
      'SELECT id, title, message, dealer_id FROM notifications WHERE id = ?',
      [testNotificationId]
    );

    if (remainingNotifications.length === 0) {
      console.log('✅ Notification successfully deleted from database');
    } else {
      console.log('❌ Notification still exists in database');
    }

    // Show remaining notifications
    const [finalNotifications] = await connection.execute(
      'SELECT id, title, message, dealer_id FROM notifications ORDER BY created_at DESC LIMIT 5'
    );

    console.log('\n📋 Remaining notifications:');
    finalNotifications.forEach(notification => {
      console.log(`  - ID: ${notification.id}, Title: ${notification.title}, Dealer: ${notification.dealer_id}`);
    });

  } catch (error) {
    console.error('❌ Error testing notification deletion:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testNotificationDeletion();
