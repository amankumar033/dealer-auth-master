const mysql = require('mysql2/promise');

// Database configuration - update these with your actual credentials
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dealer_auth',
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function addQuantityToOrders() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Check if quantity column already exists
    console.log('\n📋 Checking if quantity column exists...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'quantity'
    `, [dbConfig.database]);

    if (columns.length > 0) {
      console.log('✅ Quantity column already exists in orders table');
      return;
    }

    // Add quantity column to orders table
    console.log('\n🔧 Adding quantity column to orders table...');
    await connection.execute(`
      ALTER TABLE orders 
      ADD COLUMN quantity INT NOT NULL DEFAULT 1 
      AFTER product_id
    `);
    console.log('✅ Quantity column added successfully');

    // Update existing orders to have quantity = 1
    console.log('\n🔄 Updating existing orders with default quantity...');
    const [updateResult] = await connection.execute(`
      UPDATE orders 
      SET quantity = 1 
      WHERE quantity IS NULL OR quantity = 0
    `);
    console.log(`✅ Updated ${updateResult.affectedRows} orders with default quantity`);

    // Verify the column was added
    console.log('\n📋 Verifying orders table structure...');
    const [newColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders'
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);

    console.log('Orders table columns after update:');
    newColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_DEFAULT ? `DEFAULT ${col.COLUMN_DEFAULT}` : ''} ${col.EXTRA || ''}`);
    });

    console.log('\n🎉 Successfully added quantity column to orders table!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the script
addQuantityToOrders()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });



