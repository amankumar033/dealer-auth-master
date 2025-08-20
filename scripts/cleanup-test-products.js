const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dealer_auth',
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function cleanupTestProducts() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Check current products
    console.log('\n📦 Checking current products...');
    const [products] = await connection.execute(`
      SELECT product_id, dealer_id, name, created_at 
      FROM products 
      ORDER BY dealer_id, product_id
    `);
    
    console.log(`Found ${products.length} products:`);
    products.forEach(product => {
      console.log(`  - ${product.product_id}: ${product.name} (Dealer: ${product.dealer_id})`);
    });

    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will delete test products!');
    console.log('Test products are identified by names starting with "Test Product"');
    
    // Find test products
    const [testProducts] = await connection.execute(`
      SELECT product_id, dealer_id, name 
      FROM products 
      WHERE name LIKE 'Test Product%'
      ORDER BY dealer_id, product_id
    `);
    
    if (testProducts.length === 0) {
      console.log('✅ No test products found to clean up');
      return;
    }
    
    console.log(`\n🗑️  Found ${testProducts.length} test products to delete:`);
    testProducts.forEach(product => {
      console.log(`  - ${product.product_id}: ${product.name} (Dealer: ${product.dealer_id})`);
    });
    
    // Delete test products
    console.log('\n🧹 Cleaning up test products...');
    const [deleteResult] = await connection.execute(`
      DELETE FROM products 
      WHERE name LIKE 'Test Product%'
    `);
    
    console.log(`✅ Deleted ${deleteResult.affectedRows} test products`);

    // Show remaining products
    console.log('\n📦 Remaining products:');
    const [remainingProducts] = await connection.execute(`
      SELECT product_id, dealer_id, name, created_at 
      FROM products 
      ORDER BY dealer_id, product_id
    `);
    
    console.log(`Found ${remainingProducts.length} remaining products:`);
    remainingProducts.forEach(product => {
      console.log(`  - ${product.product_id}: ${product.name} (Dealer: ${product.dealer_id})`);
    });

    // Show next available product IDs for each dealer
    console.log('\n🔧 Next available product IDs for each dealer:');
    const [dealers] = await connection.execute('SELECT dealer_id FROM dealers ORDER BY dealer_id');
    
    for (const dealer of dealers) {
      const dealerId = dealer.dealer_id;
      
      // Extract dealer number
      const dealerNumberMatch = dealerId.match(/DLR(\d+)/);
      if (!dealerNumberMatch) {
        console.log(`  ❌ Invalid dealer ID format: ${dealerId}`);
        continue;
      }
      
      const dealerNumber = dealerNumberMatch[1];
      
      // Get existing product IDs for this dealer
      const [existingProducts] = await connection.execute(
        'SELECT product_id FROM products WHERE dealer_id = ? ORDER BY product_id',
        [dealerId]
      );
      
      const existingProductIds = existingProducts.map(row => row.product_id);
      console.log(`\n  Dealer ${dealerId} (${existingProductIds.length} products):`);
      
      if (existingProductIds.length > 0) {
        existingProductIds.forEach(productId => {
          console.log(`    - ${productId}`);
        });
      }
      
      // Find next available sequence number
      let sequenceNumber = 1;
      let attempts = 0;
      const maxAttempts = 100;
      
      while (attempts < maxAttempts) {
        const candidateProductId = `PRO${dealerNumber}${sequenceNumber}`;
        
        // Check if this product ID already exists
        const [existingCheck] = await connection.execute(
          'SELECT product_id FROM products WHERE product_id = ?',
          [candidateProductId]
        );
        
        if (existingCheck.length === 0) {
          console.log(`    ✅ Next available: ${candidateProductId}`);
          break;
        }
        
        sequenceNumber++;
        attempts++;
      }
      
      if (attempts >= maxAttempts) {
        console.log(`    ❌ Could not find available product ID after ${maxAttempts} attempts`);
      }
    }

    console.log('\n🎉 Cleanup completed successfully!');

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

// Run the cleanup
cleanupTestProducts()
  .then(() => {
    console.log('\n✅ Cleanup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  });
