const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kriptocar',
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function testOrderUpdate() {
  let connection;
  
  try {
    console.log('🔍 Testing Order Status Update...\n');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully\n');
    
    // Get a sample order
    const [orders] = await connection.execute(`
      SELECT * FROM orders LIMIT 1
    `);
    
    if (orders.length === 0) {
      console.log('❌ No orders found in database');
      return;
    }
    
    const order = orders[0];
    console.log('📋 Found order:', {
      order_id: order.order_id,
      current_status: order.order_status,
      dealer_id: order.dealer_id
    });
    
    // Test updating order status
    const newStatus = 'processing';
    console.log(`\n🔄 Updating order status to: ${newStatus}`);
    
    const [updateResult] = await connection.execute(
      'UPDATE orders SET order_status = ? WHERE order_id = ? AND dealer_id = ?',
      [newStatus, order.order_id, order.dealer_id]
    );
    
    console.log('✅ Order status updated successfully');
    console.log('📊 Update result:', updateResult);
    
    // Verify the update
    const [updatedOrders] = await connection.execute(
      'SELECT order_id, order_status FROM orders WHERE order_id = ?',
      [order.order_id]
    );
    
    if (updatedOrders.length > 0) {
      console.log('✅ Verification successful:', {
        order_id: updatedOrders[0].order_id,
        new_status: updatedOrders[0].order_status
      });
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
testOrderUpdate().catch(console.error);


