// Import the same database functions used by the working products API
const { executeQuery } = require('../src/lib/database');

async function testNotificationsTable() {
  try {
    console.log('🔍 Testing notifications table using the same method as products API...');
    
    // Test 1: Check if notifications table exists
    console.log('🔍 Test 1: Checking if notifications table exists...');
    try {
      const tables = await executeQuery('SHOW TABLES LIKE "notifications"', [], 2, false);
      console.log('✅ Notifications table exists:', tables);
    } catch (error) {
      console.log('❌ Notifications table does not exist or error:', error.message);
      return;
    }
    
    // Test 2: Check table structure
    console.log('🔍 Test 2: Checking table structure...');
    try {
      const columns = await executeQuery('DESCRIBE notifications', [], 2, false);
      console.log('✅ Table structure:', columns.map(col => col.Field));
    } catch (error) {
      console.log('❌ Error getting table structure:', error.message);
      return;
    }
    
    // Test 3: Check if there are any notifications
    console.log('🔍 Test 3: Checking existing notifications...');
    try {
      const count = await executeQuery('SELECT COUNT(*) as count FROM notifications', [], 2, false);
      console.log('✅ Total notifications:', count[0]?.count || 0);
    } catch (error) {
      console.log('❌ Error counting notifications:', error.message);
      return;
    }
    
    // Test 4: Test the exact API query
    console.log('🔍 Test 4: Testing the API query...');
    try {
      const query = `
        SELECT * FROM notifications 
        WHERE for_dealer = 1 AND dealer_id = ?
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      const result = await executeQuery(query, ['DLR7', 20, 0], 2, false);
      console.log('✅ API query successful!');
      console.log('📊 Found', result.length, 'notifications for dealer DLR7');
      
      if (result.length > 0) {
        console.log('📋 Sample notification:', {
          id: result[0].id,
          type: result[0].type,
          title: result[0].title,
          dealer_id: result[0].dealer_id,
          for_dealer: result[0].for_dealer
        });
      }
    } catch (error) {
      console.log('❌ Error with API query:', error.message);
      console.log('Error details:', error);
    }
    
  } catch (error) {
    console.error('❌ General error:', error);
  }
}

// Run the test
testNotificationsTable(); 