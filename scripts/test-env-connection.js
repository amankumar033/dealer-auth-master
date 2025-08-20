require('dotenv').config({ path: '.env.local' });

const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('🔍 Testing Environment Variables and Database Connection...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('  DB_HOST:', process.env.DB_HOST || 'NOT_SET');
  console.log('  DB_USER:', process.env.DB_USER || 'NOT_SET');
  console.log('  DB_NAME:', process.env.DB_NAME || 'NOT_SET');
  console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? 'SET' : 'NOT_SET');
  console.log('  DB_PORT:', process.env.DB_PORT || 'NOT_SET');
  
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    console.log('\n❌ Missing required environment variables!');
    return;
  }
  
  // Test database connection
  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 3306,
    connectTimeout: 10000,
  };
  
  console.log('\n📋 Database Config:');
  console.log('  Host:', dbConfig.host);
  console.log('  User:', dbConfig.user);
  console.log('  Database:', dbConfig.database);
  console.log('  Port:', dbConfig.port);
  
  let connection;
  try {
    console.log('\n🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Database query successful:', rows[0]);
    
    // Test the notifications table
    const [notifications] = await connection.execute('SELECT COUNT(*) as count FROM notifications');
    console.log('✅ Notifications table accessible:', notifications[0].count, 'records');
    
    // Test the specific notification
    const [specificNotification] = await connection.execute(`
      SELECT id, type, dealer_id FROM notifications WHERE id = ? AND dealer_id = ? AND type = ?
    `, [120, 'DLR7', 'order_placed']);
    
    console.log('✅ Specific notification query result:', specificNotification.length, 'records');
    if (specificNotification.length > 0) {
      console.log('  Found notification:', specificNotification[0]);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

testConnection().catch(console.error);


