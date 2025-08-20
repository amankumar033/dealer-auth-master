const mysql = require('mysql2/promise');

// Test different database configurations
async function testDatabaseConfig() {
  console.log('🔍 Testing Database Connection Configurations...\n');

  // Test 1: Current configuration (with invalid options)
  console.log('📋 Test 1: Current configuration with invalid options');
  try {
    const config1 = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'kriptocar',
      port: parseInt(process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 10,
      acquireTimeout: 60000, // This causes the warning
      timeout: 60000, // This causes the warning
      connectTimeout: 30000,
      charset: 'utf8mb4',
      multipleStatements: false,
      dateStrings: true,
      supportBigNumbers: true,
      bigNumberStrings: true,
    };

    const pool1 = mysql.createPool(config1);
    const connection1 = await pool1.getConnection();
    console.log('✅ Connection successful with invalid options (warnings expected)');
    connection1.release();
    await pool1.end();
  } catch (error) {
    console.error('❌ Connection failed with invalid options:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Fixed configuration (without invalid options)
  console.log('📋 Test 2: Fixed configuration without invalid options');
  try {
    const config2 = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'kriptocar',
      port: parseInt(process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 10,
      connectTimeout: 30000,
      charset: 'utf8mb4',
      multipleStatements: false,
      dateStrings: true,
      supportBigNumbers: true,
      bigNumberStrings: true,
    };

    const pool2 = mysql.createPool(config2);
    const connection2 = await pool2.getConnection();
    console.log('✅ Connection successful with fixed configuration (no warnings)');
    
    // Test a simple query
    const [rows] = await connection2.execute('SELECT 1 as test');
    console.log('✅ Query test successful:', rows);
    
    connection2.release();
    await pool2.end();
  } catch (error) {
    console.error('❌ Connection failed with fixed configuration:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Test table structure
  console.log('📋 Test 3: Testing table structure');
  try {
    const config3 = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'kriptocar',
      port: parseInt(process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 10,
      connectTimeout: 30000,
      charset: 'utf8mb4',
    };

    const pool3 = mysql.createPool(config3);
    const connection3 = await pool3.getConnection();
    
    // Test categories table
    const [categories] = await connection3.execute('SHOW TABLES LIKE "categories"');
    console.log('📊 Categories table exists:', categories.length > 0);
    
    if (categories.length > 0) {
      const [categoryStructure] = await connection3.execute('DESCRIBE categories');
      console.log('📋 Categories table structure:');
      categoryStructure.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }
    
    // Test products table
    const [products] = await connection3.execute('SHOW TABLES LIKE "products"');
    console.log('📊 Products table exists:', products.length > 0);
    
    if (products.length > 0) {
      const [productStructure] = await connection3.execute('DESCRIBE products');
      console.log('📋 Products table structure:');
      productStructure.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }
    
    connection3.release();
    await pool3.end();
  } catch (error) {
    console.error('❌ Table structure test failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Test sample data
  console.log('📋 Test 4: Testing sample data');
  try {
    const config4 = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'kriptocar',
      port: parseInt(process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 10,
      connectTimeout: 30000,
      charset: 'utf8mb4',
    };

    const pool4 = mysql.createPool(config4);
    const connection4 = await pool4.getConnection();
    
    // Test categories data
    const [categoryCount] = await connection4.execute('SELECT COUNT(*) as count FROM categories');
    console.log('📊 Total categories:', categoryCount[0].count);
    
    if (categoryCount[0].count > 0) {
      const [sampleCategories] = await connection4.execute('SELECT category_id, name, dealer_id FROM categories LIMIT 3');
      console.log('📋 Sample categories:');
      sampleCategories.forEach(cat => {
        console.log(`  - ${cat.category_id}: ${cat.name} (Dealer: ${cat.dealer_id})`);
      });
    }
    
    // Test products data
    const [productCount] = await connection4.execute('SELECT COUNT(*) as count FROM products');
    console.log('📊 Total products:', productCount[0].count);
    
    if (productCount[0].count > 0) {
      const [sampleProducts] = await connection4.execute('SELECT product_id, name, dealer_id FROM products LIMIT 3');
      console.log('📋 Sample products:');
      sampleProducts.forEach(prod => {
        console.log(`  - ${prod.product_id}: ${prod.name} (Dealer: ${prod.dealer_id})`);
      });
    }
    
    connection4.release();
    await pool4.end();
  } catch (error) {
    console.error('❌ Sample data test failed:', error.message);
  }
}

// Run the tests
testDatabaseConfig()
  .then(() => {
    console.log('\n🎉 Database connection tests completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  }); 