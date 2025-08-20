const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: '82.29.162.35',
  user: 'kriptocar',
  password: 'kriptocar',
  database: 'kriptocar',
  port: 3306,
};

async function createProductsForDLR7() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Create test products for DLR7 with unique IDs
    console.log('\n📦 Creating test products for DLR7...');
    
    const testProducts = [
      {
        product_id: 'PRO0073',
        name: 'DLR7 Engine Oil',
        description: 'High-quality synthetic engine oil for optimal performance',
        short_description: 'Premium synthetic oil',
        sale_price: 89.99,
        original_price: 119.99,
        rating: 4.5,
        brand_name: 'DLR7Brand',
        sub_brand_name: 'Premium',
        stock_quantity: 50,
        category_id: 'CTR1', // Engine Parts
        sub_category_id: null,
        slug: 'dlr7-engine-oil'
      },
      {
        product_id: 'PRO0074',
        name: 'DLR7 Brake Pads',
        description: 'Ceramic brake pads for superior stopping power',
        short_description: 'Ceramic brake pads',
        sale_price: 149.99,
        original_price: 199.99,
        rating: 4.8,
        brand_name: 'DLR7Brand',
        sub_brand_name: 'Performance',
        stock_quantity: 30,
        category_id: 'CTR1', // Engine Parts
        sub_category_id: null,
        slug: 'dlr7-brake-pads'
      },
      {
        product_id: 'PRO0075',
        name: 'DLR7 Air Filter',
        description: 'High-performance air filter for better engine breathing',
        short_description: 'Performance air filter',
        sale_price: 29.99,
        original_price: 39.99,
        rating: 4.3,
        brand_name: 'DLR7Brand',
        sub_brand_name: 'Standard',
        stock_quantity: 100,
        category_id: 'CTR12', // Filters
        sub_category_id: null,
        slug: 'dlr7-air-filter'
      }
    ];

    for (const product of testProducts) {
      try {
        await connection.execute(`
          INSERT INTO products (
            product_id, dealer_id, name, slug, description, short_description, sale_price, original_price, rating, 
            image_1, image_2, image_3, image_4, category_id, sub_category_id,
            brand_name, sub_brand_name, stock_quantity, is_active, is_featured, is_hot_deal, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          product.product_id, 'DLR7', product.name, product.slug, product.description, product.short_description,
          product.sale_price, product.original_price, product.rating, null, null, null, null,
          product.category_id, product.sub_category_id, product.brand_name, product.sub_brand_name,
          product.stock_quantity, 1, 0, 0
        ]);
        console.log(`✅ Created product: ${product.name} (${product.product_id})`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️ Product ${product.product_id} already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }

    // Verify the products were created
    console.log('\n🔍 Verifying created products...');
    const [products] = await connection.execute('SELECT product_id, name FROM products WHERE dealer_id = ?', ['DLR7']);
    console.log(`Dealer DLR7 now has ${products.length} products:`);
    products.forEach(product => {
      console.log(`  - ${product.product_id}: ${product.name}`);
    });

    // Also check orders
    const [orders] = await connection.execute('SELECT order_id, qauntity, order_status FROM orders WHERE dealer_id = ?', ['DLR7']);
    console.log(`\nDealer DLR7 has ${orders.length} orders:`);
    orders.forEach(order => {
      console.log(`  - ${order.order_id}: Qty ${order.qauntity}, Status: ${order.order_status}`);
    });

    console.log('\n🎉 Product creation completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Refresh your dashboard page');
    console.log('2. You should now see products and orders for dealer DLR7');
    console.log('3. The quantity should display correctly (2 and 1)');

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
createProductsForDLR7()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });













