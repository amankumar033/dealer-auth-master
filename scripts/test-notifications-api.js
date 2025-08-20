const mysql = require('mysql2/promise');
require('dotenv').config();

async function testNotificationsAPI() {
  let connection;
  
  try {
    console.log('🧪 Testing Notifications API...');
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'kriptocar',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to database');

    // Test 1: Check if notifications table exists
    console.log('\n📋 Test 1: Checking notifications table structure...');
    try {
      const [tableInfo] = await connection.execute(`
        SELECT TABLE_NAME, TABLE_ROWS 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'notifications'
      `, [process.env.DB_NAME || 'kriptocar']);
      
      if (tableInfo.length > 0) {
        console.log('✅ Notifications table exists');
        console.log('📊 Table info:', tableInfo[0]);
      } else {
        console.log('❌ Notifications table does not exist');
        return;
      }
    } catch (error) {
      console.error('❌ Error checking table:', error.message);
      return;
    }

    // Test 2: Check table structure
    console.log('\n📋 Test 2: Checking table structure...');
    try {
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'notifications'
        ORDER BY ORDINAL_POSITION
      `, [process.env.DB_NAME || 'kriptocar']);
      
      console.log('📊 Table columns:');
      columns.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (nullable: ${col.IS_NULLABLE})`);
      });
    } catch (error) {
      console.error('❌ Error checking columns:', error.message);
    }

    // Test 3: Check if there are any notifications for DLR7
    console.log('\n📋 Test 3: Checking notifications for DLR7...');
    try {
      const [notifications] = await connection.execute(`
        SELECT COUNT(*) as total_count
        FROM notifications 
        WHERE dealer_id = ? AND for_dealer = 1
      `, ['DLR7']);
      
      console.log('📊 Total notifications for DLR7:', notifications[0].total_count);
    } catch (error) {
      console.error('❌ Error counting notifications:', error.message);
    }

    // Test 4: Try the actual query with optimizations
    console.log('\n📋 Test 4: Testing the actual query...');
    try {
      // Apply session optimizations
      await connection.execute('SET SESSION sort_buffer_size = 2097152');
      await connection.execute('SET SESSION join_buffer_size = 1048576');
      await connection.execute('SET SESSION read_buffer_size = 1048576');
      await connection.execute('SET SESSION read_rnd_buffer_size = 2097152');
      
      const startTime = Date.now();
      const [results] = await connection.execute(`
        SELECT id, dealer_id, title, message, type, is_read, for_dealer, created_at, updated_at 
        FROM notifications 
        WHERE dealer_id = ? AND for_dealer = 1 
        ORDER BY created_at DESC 
        LIMIT 50 OFFSET 0
      `, ['DLR7']);
      
      const endTime = Date.now();
      console.log(`✅ Query executed successfully in ${endTime - startTime}ms`);
      console.log(`📊 Found ${results.length} notifications`);
      
      if (results.length > 0) {
        console.log('📋 Sample notification:', results[0]);
      }
    } catch (error) {
      console.error('❌ Error executing query:', error.message);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error errno:', error.errno);
    }

    // Test 5: Check total count
    console.log('\n📋 Test 5: Testing count query...');
    try {
      const [countResult] = await connection.execute(`
        SELECT COUNT(*) as total 
        FROM notifications 
        WHERE dealer_id = ? AND for_dealer = 1
      `, ['DLR7']);
      
      console.log('📊 Total count:', countResult[0].total);
    } catch (error) {
      console.error('❌ Error counting:', error.message);
    }

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
testNotificationsAPI()
  .then(() => {
    console.log('\n🎉 Notifications API test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Notifications API test failed:', error);
    process.exit(1);
  }); 