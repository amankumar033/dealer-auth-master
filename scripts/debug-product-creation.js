const mysql = require('mysql2/promise');

const dbConfig = {
  host: '82.29.162.35',
  user: 'kriptocar',
  password: 'kriptocar',
  database: 'kriptocar',
  port: 3306,
  connectTimeout: 10000,
};

async function debugProductCreation() {
  console.log('🔍 Debugging product creation issue...\n');
  
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Check all dealers
    const [dealers] = await connection.execute('SELECT dealer_id, business_name, name, email FROM dealers ORDER BY dealer_id');
    
    console.log('📋 Available Dealers:');
    console.log('─'.repeat(80));
    dealers.forEach((dealer, index) => {
      console.log(`${index + 1}. ${dealer.dealer_id} - ${dealer.business_name} (${dealer.name})`);
    });
    console.log('─'.repeat(80));
    
    // Check if there are any products
    const [products] = await connection.execute('SELECT COUNT(*) as count FROM products');
    console.log(`📊 Total Products in Database: ${products[0].count}`);
    
    if (products[0].count > 0) {
      const [sampleProducts] = await connection.execute('SELECT product_id, dealer_id, name FROM products LIMIT 5');
      console.log('\n📋 Sample Products:');
      console.log('─'.repeat(80));
      sampleProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.product_id} - ${product.name} (Dealer: ${product.dealer_id})`);
      });
      console.log('─'.repeat(80));
    }
    
    // Test the exact query that's failing
    console.log('\n🧪 Testing Product Creation Query...');
    
    // Try to create a product with a valid dealer_id
    const testDealerId = dealers[0]?.dealer_id;
    if (testDealerId) {
      console.log(`Testing with dealer_id: ${testDealerId}`);
      
      const testProductData = {
        product_id: 'TEST_PROD_' + Date.now(),
        dealer_id: testDealerId,
        name: 'Test Product',
        description: 'Test Description',
        short_description: 'Test Short Description',
        sale_price: 99.99,
        original_price: 129.99,
        rating: 4.5,
        category_id: 'CAT001',
        brand: 'Test Brand',
        stock_quantity: 10,
        is_active: true,
        is_featured: false,
        is_hot_deal: false
      };
      
      const insertQuery = `
        INSERT INTO products (
          product_id, dealer_id, name, description, short_description, sale_price, original_price, rating, 
          image_1, image_2, image_3, image_4, category_id,
          brand, stock_quantity, is_active, is_featured, is_hot_deal, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const insertParams = [
        testProductData.product_id,
        testProductData.dealer_id,
        testProductData.name,
        testProductData.description,
        testProductData.short_description,
        testProductData.sale_price,
        testProductData.original_price,
        testProductData.rating,
        null, // image_1
        null, // image_2
        null, // image_3
        null, // image_4
        testProductData.category_id,
        testProductData.brand,
        testProductData.stock_quantity,
        testProductData.is_active,
        testProductData.is_featured,
        testProductData.is_hot_deal
      ];
      
      console.log('Insert Query:', insertQuery);
      console.log('Insert Parameters:', insertParams);
      
      try {
        const result = await connection.execute(insertQuery, insertParams);
        console.log('✅ Test product created successfully!');
        console.log('Result:', result);
        
        // Clean up - delete the test product
        await connection.execute('DELETE FROM products WHERE product_id = ?', [testProductData.product_id]);
        console.log('🧹 Test product cleaned up');
        
      } catch (error) {
        console.error('❌ Test product creation failed:', error.message);
        console.error('Error details:', {
          code: error.code,
          errno: error.errno,
          sqlState: error.sqlState,
          sqlMessage: error.sqlMessage
        });
      }
      
    } else {
      console.log('❌ No dealers found to test with');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Connection closed');
    }
  }
}

debugProductCreation();
