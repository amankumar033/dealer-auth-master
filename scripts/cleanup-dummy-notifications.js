const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kriptocar',
  port: parseInt(process.env.DB_PORT || '3306')
};

async function cleanupDummyNotifications() {
  let connection;
  
  try {
    console.log('🧹 Cleaning up dummy notifications...');
    
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // List of dummy product names to remove
    const dummyProductNames = [
      'iPhone 15 Pro',
      'Samsung Galaxy S24',
      'Fake AirPods',
      'PROD001',
      'PROD002',
      'PROD003',
      'ORD001'
    ];
    
    // Build the WHERE clause for dummy notifications
    const whereConditions = dummyProductNames.map(name => 
      `message LIKE '%${name}%' OR title LIKE '%${name}%' OR product_id = '${name}' OR order_id = '${name}'`
    ).join(' OR ');
    
    const deleteQuery = `DELETE FROM notifications WHERE ${whereConditions}`;
    
    console.log('🔍 Deleting notifications with dummy data...');
    console.log('Query:', deleteQuery);
    
    const result = await connection.execute(deleteQuery);
    console.log(`✅ Deleted ${result[0].affectedRows} dummy notifications`);
    
    // Show remaining notifications
    const remainingNotifications = await connection.execute('SELECT COUNT(*) as count FROM notifications');
    console.log(`📊 Remaining notifications: ${remainingNotifications[0][0].count}`);
    
    if (remainingNotifications[0][0].count > 0) {
      const sampleNotifications = await connection.execute('SELECT id, type, title, created_at FROM notifications ORDER BY created_at DESC LIMIT 5');
      console.log('📋 Sample remaining notifications:');
      sampleNotifications[0].forEach(notification => {
        console.log(`  - ID: ${notification.id}, Type: ${notification.type}, Title: ${notification.title}, Created: ${notification.created_at}`);
      });
    }
    
    console.log('🎉 Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error cleaning up dummy notifications:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the cleanup
cleanupDummyNotifications(); 