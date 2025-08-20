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

async function checkOrdersTable() {
  let connection;
  
  try {
    console.log('🔍 Checking orders table structure...\n');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Check orders table structure
    console.log('📋 Orders table structure:');
    const [columns] = await connection.execute('DESCRIBE orders');
    columns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.Field} - ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
    });
    
    // Check sample orders
    console.log('\n📋 Sample orders:');
    const [orders] = await connection.execute('SELECT * FROM orders LIMIT 3');
    console.log('✅ Found orders:', orders.length);
    
    if (orders.length > 0) {
      orders.forEach((order, index) => {
        console.log(`\nOrder ${index + 1}:`);
        Object.keys(order).forEach(key => {
          console.log(`  ${key}: ${order[key]}`);
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the check
checkOrdersTable().catch(console.error);


