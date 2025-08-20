const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kriptocar',
  port: parseInt(process.env.DB_PORT || '3306'),
  charset: 'utf8mb4',
};

async function testProductsAPI() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Test 1: Check if products table exists
    console.log('\n📋 Test 1: Checking products table...');
    const [productsColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products'
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);
    
    console.log('Products table columns:');
    productsColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Test 2: Check if categories table exists
    console.log('\n📋 Test 2: Checking categories table...');
    const [categoriesColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'categories'
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);
    
    console.log('Categories table columns:');
    categoriesColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Test 3: Check if dealers table exists
    console.log('\n📋 Test 3: Checking dealers table...');
    const [dealersColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'dealers'
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);
    
    console.log('Dealers table columns:');
    dealersColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Test 4: Check existing products
    console.log('\n📦 Test 4: Checking existing products...');
    const [products] = await connection.execute(`
      SELECT product_id, name, dealer_id, category_id 
      FROM products 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('Recent products:');
    products.forEach(prod => {
      console.log(`  - ${prod.product_id}: "${prod.name}" (dealer_id: ${prod.dealer_id}, category_id: ${prod.category_id})`);
    });

    // Test 5: Check existing categories
    console.log('\n🏷️ Test 5: Checking existing categories...');
    const [categories] = await connection.execute(`
      SELECT category_id, name, dealer_id 
      FROM categories 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('Recent categories:');
    categories.forEach(cat => {
      console.log(`  - ${cat.category_id}: "${cat.name}" (dealer_id: ${cat.dealer_id})`);
    });

    // Test 6: Test the getProductsByCategory query directly
    if (products.length > 0 && categories.length > 0) {
      const testProduct = products[0];
      const testCategory = categories[0];
      
      console.log(`\n🔄 Test 6: Testing getProductsByCategory query...`);
      console.log(`  - Using dealer_id: ${testProduct.dealer_id}`);
      console.log(`  - Using category_id: ${testProduct.category_id}`);
      
      const getProductsByCategoryQuery = `
        SELECT p.*, d.business_name, d.name as dealer_name, d.phone as dealer_phone,
               c.name as category_name
        FROM products p 
        LEFT JOIN dealers d ON p.dealer_id = d.dealer_id
        LEFT JOIN categories c ON p.category_id = c.category_id
        WHERE p.dealer_id = ? AND p.category_id = ? 
        ORDER BY p.created_at DESC
      `;
      
      try {
        const [result] = await connection.execute(getProductsByCategoryQuery, [testProduct.dealer_id, testProduct.category_id]);
        console.log(`  - Query executed successfully, found ${result.length} products`);
        
        if (result.length > 0) {
          console.log(`  - First product: ${result[0].name} (${result[0].product_id})`);
        }
      } catch (error) {
        console.error(`  - Query failed:`, error.message);
      }
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the test
testProductsAPI().catch(console.error); 