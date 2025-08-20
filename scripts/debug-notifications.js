const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kriptocar',
  port: parseInt(process.env.DB_PORT || '3306')
};

async function debugNotifications() {
  let connection;
  
  try {
    console.log('🔍 Debugging notification system...');
    console.log('📋 Database config:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port
    });
    
    // Try to connect
    console.log('🔌 Attempting database connection...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully!');
    
    // Check if notifications table exists
    console.log('🔍 Checking notifications table...');
    const [tables] = await connection.execute('SHOW TABLES LIKE "notifications"');
    
    if (tables.length === 0) {
      console.log('❌ Notifications table does not exist!');
      return;
    }
    
    console.log('✅ Notifications table exists');
    
    // Check table structure
    console.log('🔍 Checking table structure...');
    const [columns] = await connection.execute('DESCRIBE notifications');
    console.log('📋 Table columns:', columns.map(col => col.Field));
    
    // Check if there are any notifications
    console.log('🔍 Checking existing notifications...');
    const [notifications] = await connection.execute('SELECT COUNT(*) as count FROM notifications');
    console.log('📊 Total notifications:', notifications[0].count);
    
    if (notifications[0].count > 0) {
      // Show sample notifications
      const [sampleNotifications] = await connection.execute(`
        SELECT id, type, title, for_dealer, dealer_id, created_at 
        FROM notifications 
        LIMIT 5
      `);
      console.log('📋 Sample notifications:', sampleNotifications);
    }
    
    // Test the exact query that the API uses
    console.log('🔍 Testing API query...');
    const dealerId = 'DLR7';
    const limit = 20;
    const offset = 0;
    
    const query = `
      SELECT * FROM notifications 
      WHERE for_dealer = 1 AND dealer_id = ?
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    const [result] = await connection.execute(query, [dealerId, limit, offset]);
    console.log('✅ API query executed successfully!');
    console.log('📊 Found', result.length, 'notifications for dealer DLR7');
    
    if (result.length > 0) {
      console.log('📋 First notification:', result[0]);
    }
    
  } catch (error) {
    console.error('❌ Error debugging notifications:', error);
    console.error('Error details:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Solution: Make sure MySQL is running on your system');
      console.log('💡 You can start MySQL with:');
      console.log('   - Windows: Start MySQL service from Services');
      console.log('   - macOS: brew services start mysql');
      console.log('   - Linux: sudo systemctl start mysql');
    }
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Solution: Check your database username and password');
    }
    
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 Solution: Database "kriptocar" does not exist');
      console.log('💡 Create it with: CREATE DATABASE kriptocar;');
    }
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the debug
debugNotifications(); 