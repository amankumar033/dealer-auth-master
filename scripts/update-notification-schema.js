const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: '82.29.162.35',
  user: 'kriptocar',
  password: 'kriptocar',
  database: 'kriptocar',
  port: 3306,
  connectTimeout: 10000,
};

async function updateNotificationSchema() {
  let connection;
  
  try {
    console.log('🔧 Updating notification schema...');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Update notification types to include order_accepted and order_rejected
    console.log('🔧 Updating notification types...');
    await connection.execute(`
      ALTER TABLE notifications 
      MODIFY COLUMN type ENUM(
        'product_created', 
        'product_approved', 
        'product_rejected', 
        'order_placed', 
        'order_accepted',
        'order_rejected',
        'user_registered', 
        'vendor_registered'
      ) NOT NULL
    `);
    console.log('✅ Notification types updated');
    
    // Check if description column exists
    const [columns] = await connection.execute('DESCRIBE notifications');
    const hasDescription = columns.some(col => col.Field === 'description');
    
    if (!hasDescription) {
      console.log('🔧 Adding description column...');
      await connection.execute(`
        ALTER TABLE notifications 
        ADD COLUMN description TEXT AFTER message
      `);
      console.log('✅ Description column added');
    } else {
      console.log('✅ Description column already exists');
    }
    
    // Update existing order_placed notifications to have proper descriptions
    console.log('🔧 Updating existing order_placed notifications...');
    await connection.execute(`
      UPDATE notifications 
      SET description = 'New order received. Please review and accept or reject.'
      WHERE type = 'order_placed' AND (description IS NULL OR description = '')
    `);
    console.log('✅ Existing notifications updated');
    
    console.log('🎉 Notification schema updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating notification schema:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the update
updateNotificationSchema().catch(console.error);


