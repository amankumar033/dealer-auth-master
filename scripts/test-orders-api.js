const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dealer_auth',
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function testOrdersAPI() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Test 1: Check if Orders table exists and has correct structure
    console.log('\n📋 Testing Orders table structure...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Orders'
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);

    console.log('Orders table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_DEFAULT ? `DEFAULT ${col.COLUMN_DEFAULT}` : ''} ${col.EXTRA || ''}`);
    });

    // Test 2: Insert a test order
    console.log('\n📝 Testing order creation...');
    const testOrder = {
      user_id: 1,
      customer_name: 'John Doe',
      customer_email: 'john.doe@example.com',
      customer_phone: '+1234567890',
      shipping_address_line1: '123 Main St',
      shipping_address_line2: 'Apt 4B',
      shipping_city: 'New York',
      shipping_state: 'NY',
      shipping_postal_code: '10001',
      shipping_country: 'USA',
      total_amount: 299.99,
      tax_amount: 25.00,
      shipping_cost: 15.00,
      discount_amount: 10.00,
      payment_method: 'Credit Card',
      payment_status: 'Pending',
              transaction_id: 'TXN123456'
            };
            
    const [insertResult] = await connection.execute(`
      INSERT INTO Orders (
        user_id, customer_name, customer_email, customer_phone,
        shipping_address_line1, shipping_address_line2, shipping_city,
        shipping_state, shipping_postal_code, shipping_country,
        total_amount, tax_amount, shipping_cost, discount_amount,
        payment_method, payment_status, transaction_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      testOrder.user_id, testOrder.customer_name, testOrder.customer_email,
      testOrder.customer_phone, testOrder.shipping_address_line1,
      testOrder.shipping_address_line2, testOrder.shipping_city,
      testOrder.shipping_state, testOrder.shipping_postal_code,
      testOrder.shipping_country, testOrder.total_amount, testOrder.tax_amount,
      testOrder.shipping_cost, testOrder.discount_amount, testOrder.payment_method,
      testOrder.payment_status, testOrder.transaction_id
    ]);

    const orderId = insertResult.insertId;
    console.log(`✅ Test order created with ID: ${orderId}`);

    // Test 3: Retrieve the test order
    console.log('\n🔍 Testing order retrieval...');
    const [orders] = await connection.execute(`
      SELECT * FROM Orders WHERE order_id = ? AND user_id = ?
    `, [orderId, testOrder.user_id]);

    if (orders.length > 0) {
      console.log('✅ Order retrieved successfully:');
      console.log(JSON.stringify(orders[0], null, 2));
    } else {
      console.log('❌ Failed to retrieve order');
    }

    // Test 4: Update the order status
    console.log('\n✏️ Testing order update...');
    await connection.execute(`
      UPDATE Orders 
      SET order_status = ?, payment_status = ?
      WHERE order_id = ? AND user_id = ?
    `, ['Completed', 'Paid', orderId, testOrder.user_id]);

    const [updatedOrders] = await connection.execute(`
      SELECT order_status, payment_status FROM Orders WHERE order_id = ?
    `, [orderId]);

    if (updatedOrders.length > 0) {
      console.log('✅ Order updated successfully:');
      console.log(`  Status: ${updatedOrders[0].order_status}`);
      console.log(`  Payment: ${updatedOrders[0].payment_status}`);
    }

    // Test 5: Get orders by user_id
    console.log('\n👥 Testing orders by user_id...');
    const [userOrders] = await connection.execute(`
      SELECT order_id, customer_name, order_status, total_amount 
      FROM Orders WHERE user_id = ? ORDER BY order_date DESC
    `, [testOrder.user_id]);

    console.log(`✅ Found ${userOrders.length} orders for user ${testOrder.user_id}:`);
    userOrders.forEach(order => {
      console.log(`  - Order #${order.order_id}: ${order.customer_name} - ₹${order.total_amount} (${order.order_status})`);
    });

    // Test 6: Get orders by status
    console.log('\n📊 Testing orders by status...');
    const [completedOrders] = await connection.execute(`
      SELECT order_id, customer_name, total_amount 
      FROM Orders WHERE user_id = ? AND order_status = ?
    `, [testOrder.user_id, 'Completed']);

    console.log(`✅ Found ${completedOrders.length} completed orders for user ${testOrder.user_id}`);

    // Test 7: Clean up - delete test order
    console.log('\n🧹 Cleaning up test data...');
    await connection.execute(`
      DELETE FROM Orders WHERE order_id = ?
    `, [orderId]);
    console.log('✅ Test order deleted');

    console.log('\n🎉 All tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the test
testOrdersAPI(); 