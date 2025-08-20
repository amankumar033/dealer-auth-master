const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dealer_auth',
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function testProductIdGeneration() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Test 1: Check existing dealers
    console.log('\n📋 TEST 1: Checking existing dealers...');
    const [dealers] = await connection.execute('SELECT dealer_id, business_name FROM dealers ORDER BY dealer_id');
    console.log('Found dealers:', dealers.length);
    dealers.forEach(dealer => {
      console.log(`  - ${dealer.dealer_id}: ${dealer.business_name}`);
    });

    // Test 2: Check existing products and their IDs
    console.log('\n📦 TEST 2: Checking existing products...');
    const [products] = await connection.execute(`
      SELECT product_id, dealer_id, name, created_at 
      FROM products 
      ORDER BY dealer_id, product_id
    `);
    console.log('Found products:', products.length);
    
    // Group products by dealer
    const productsByDealer = {};
    products.forEach(product => {
      if (!productsByDealer[product.dealer_id]) {
        productsByDealer[product.dealer_id] = [];
      }
      productsByDealer[product.dealer_id].push(product);
    });
    
    Object.keys(productsByDealer).forEach(dealerId => {
      console.log(`\n  Dealer ${dealerId} products:`);
      productsByDealer[dealerId].forEach(product => {
        console.log(`    - ${product.product_id}: ${product.name}`);
      });
    });

    // Test 3: Simulate the new product ID generation logic
    console.log('\n🔧 TEST 3: Simulating new product ID generation...');
    
    const testDealers = ['DLR7', 'DLR8', 'DLR9', 'DLR10'];
    
    for (const dealerId of testDealers) {
      console.log(`\n  Testing dealer: ${dealerId}`);
      
      // Extract dealer number
      const dealerNumberMatch = dealerId.match(/DLR(\d+)/);
      if (!dealerNumberMatch) {
        console.log(`    ❌ Invalid dealer ID format: ${dealerId}`);
        continue;
      }
      
      const dealerNumber = dealerNumberMatch[1];
      console.log(`    📋 Dealer number: ${dealerNumber}`);
      
      // Check if dealer exists
      const [dealerCheck] = await connection.execute(
        'SELECT dealer_id FROM dealers WHERE dealer_id = ?',
        [dealerId]
      );
      
      if (dealerCheck.length === 0) {
        console.log(`    ❌ Dealer ${dealerId} does not exist`);
        continue;
      }
      
      console.log(`    ✅ Dealer ${dealerId} exists`);
      
      // Get existing product IDs for this dealer
      const [existingProducts] = await connection.execute(
        'SELECT product_id FROM products WHERE dealer_id = ? ORDER BY product_id',
        [dealerId]
      );
      
      const existingProductIds = existingProducts.map(row => row.product_id);
      console.log(`    📦 Existing products: ${existingProductIds.length}`);
      
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
          console.log(`    ✅ Next available product ID: ${candidateProductId}`);
          break;
        }
        
        sequenceNumber++;
        attempts++;
      }
      
      if (attempts >= maxAttempts) {
        console.log(`    ❌ Could not find available product ID after ${maxAttempts} attempts`);
      }
    }

    // Test 4: Test concurrent product ID generation (simulation)
    console.log('\n⚡ TEST 4: Testing concurrent product ID generation...');
    
    const testDealerId = 'DLR7';
    console.log(`  Testing concurrent generation for dealer: ${testDealerId}`);
    
    // Simulate multiple concurrent requests
    const concurrentRequests = 5;
    const promises = [];
    
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(simulateProductCreation(connection, testDealerId, i + 1));
    }
    
    try {
      const results = await Promise.all(promises);
      console.log('  Concurrent generation results:');
      results.forEach((result, index) => {
        console.log(`    Request ${index + 1}: ${result.success ? '✅' : '❌'} ${result.productId || result.error}`);
      });
    } catch (error) {
      console.log('  ❌ Concurrent generation failed:', error.message);
    }

    console.log('\n🎉 Product ID generation tests completed!');

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

// Helper function to simulate product creation
async function simulateProductCreation(connection, dealerId, requestNumber) {
  const transactionConnection = await connection.getConnection();
  
  try {
    await transactionConnection.beginTransaction();
    
    // Extract dealer number
    const dealerNumberMatch = dealerId.match(/DLR(\d+)/);
    if (!dealerNumberMatch) {
      throw new Error(`Invalid dealer ID format: ${dealerId}`);
    }
    
    const dealerNumber = dealerNumberMatch[1];
    
    // Find available product ID
    let sequenceNumber = 1;
    const maxAttempts = 100;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const candidateProductId = `PRO${dealerNumber}${sequenceNumber}`;
      
      // Check with lock to prevent race conditions
      const [existingCheck] = await transactionConnection.execute(
        'SELECT product_id FROM products WHERE product_id = ? FOR UPDATE',
        [candidateProductId]
      );
      
      if (existingCheck.length === 0) {
        // Simulate product creation
        await transactionConnection.execute(
          'INSERT INTO products (product_id, dealer_id, name, description, sale_price, original_price, stock_quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [candidateProductId, dealerId, `Test Product ${requestNumber}`, 'Test Description', 99.99, 129.99, 10]
        );
        
        await transactionConnection.commit();
        return { success: true, productId: candidateProductId };
      }
      
      sequenceNumber++;
      attempts++;
    }
    
    throw new Error(`Could not find available product ID after ${maxAttempts} attempts`);
    
  } catch (error) {
    await transactionConnection.rollback();
    return { success: false, error: error.message };
  } finally {
    transactionConnection.release();
  }
}

// Run the test
testProductIdGeneration()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
