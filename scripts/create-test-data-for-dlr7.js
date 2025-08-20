const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: '82.29.162.35',
  user: 'kriptocar',
  password: 'kriptocar',
  database: 'kriptocar',
  port: 3306,
};

async function createTestDataForDLR7() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Check if dealer DLR7 exists
    console.log('\n📋 Checking if dealer DLR7 exists...');
    const [dealers] = await connection.execute('SELECT dealer_id, business_name FROM dealers WHERE dealer_id = ?', ['DLR7']);
    
    if (dealers.length === 0) {
      console.log('❌ Dealer DLR7 does not exist. Creating it...');
      await connection.execute(`
        INSERT INTO dealers (dealer_id, business_name, name, email, password_hash, phone, business_address, pincode, tax_id, is_verified, rating, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, ['DLR7', 'Test Dealer 7', 'Test Dealer', 'test7@example.com', 'hashedpassword', '1234567890', 'Test Address', '123456', 'TAX123', 1, 5.0]);
      console.log('✅ Created dealer DLR7');
    } else {
      console.log('✅ Dealer DLR7 exists:', dealers[0].business_name);
    }

    // Create test products for DLR7
    console.log('\n📦 Creating test products for DLR7...');
    
    const testProducts = [
      {
        product_id: 'PRO0071',
        name: 'Test Engine Oil',
        description: 'High-quality synthetic engine oil for optimal performance',
        short_description: 'Premium synthetic oil',
        sale_price: 89.99,
        original_price: 119.99,
        rating: 4.5,
        brand_name: 'TestBrand',
        sub_brand_name: 'Premium',
        stock_quantity: 50,
        category_id: 'CTR1', // Engine Parts
        sub_category_id: null,
        slug: 'test-engine-oil'
      },
      {
        product_id: 'PRO0072',
        name: 'Test Brake Pads',
        description: 'Ceramic brake pads for superior stopping power',
        short_description: 'Ceramic brake pads',
        sale_price: 149.99,
        original_price: 199.99,
        rating: 4.8,
        brand_name: 'TestBrand',
        sub_brand_name: 'Performance',
        stock_quantity: 30,
        category_id: 'CTR1', // Engine Parts
        sub_category_id: null,
        slug: 'test-brake-pads'
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

    // Create test orders for DLR7
    console.log('\n📋 Creating test orders for DLR7...');
    
    const testOrders = [
      {
        order_id: 'ORD1015',
        user_id: 'USR101',
        product_id: 'PRO0071',
        qauntity: 2,
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        customer_phone: '1234567890',
        shipping_address: '123 Test Street, Test City',
        shipping_pincode: '123456',
        order_status: 'pending',
        total_amount: 179.98,
        tax_amount: 18.00,
        shipping_cost: 10.00,
        discount_amount: 0.00,
        payment_method: 'Credit Card',
        payment_status: 'pending',
        transaction_id: 'TXN001'
      },
      {
        order_id: 'ORD1016',
        user_id: 'USR101',
        product_id: 'PRO0072',
        qauntity: 1,
        customer_name: 'Jane Smith',
        customer_email: 'jane@example.com',
        customer_phone: '0987654321',
        shipping_address: '456 Test Avenue, Test City',
        shipping_pincode: '654321',
        order_status: 'processing',
        total_amount: 149.99,
        tax_amount: 15.00,
        shipping_cost: 10.00,
        discount_amount: 0.00,
        payment_method: 'Credit Card',
        payment_status: 'paid',
        transaction_id: 'TXN002'
      }
    ];

    for (const order of testOrders) {
      try {
        await connection.execute(`
          INSERT INTO orders (
            order_id, user_id, dealer_id, product_id, qauntity, customer_name, customer_email, customer_phone, 
            shipping_address, shipping_pincode, order_date, order_status, total_amount, 
            tax_amount, shipping_cost, discount_amount, payment_method, payment_status, transaction_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          order.order_id, order.user_id, 'DLR7', order.product_id, order.qauntity,
          order.customer_name, order.customer_email, order.customer_phone,
          order.shipping_address, order.shipping_pincode, order.order_status,
          order.total_amount, order.tax_amount, order.shipping_cost, order.discount_amount,
          order.payment_method, order.payment_status, order.transaction_id
        ]);
        console.log(`✅ Created order: ${order.order_id} for ${order.customer_name}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️ Order ${order.order_id} already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }

    // Verify the data was created
    console.log('\n🔍 Verifying created data...');
    const [products] = await connection.execute('SELECT product_id, name FROM products WHERE dealer_id = ?', ['DLR7']);
    console.log(`Dealer DLR7 now has ${products.length} products:`);
    products.forEach(product => {
      console.log(`  - ${product.product_id}: ${product.name}`);
    });

    const [orders] = await connection.execute('SELECT order_id, qauntity, order_status FROM orders WHERE dealer_id = ?', ['DLR7']);
    console.log(`Dealer DLR7 now has ${orders.length} orders:`);
    orders.forEach(order => {
      console.log(`  - ${order.order_id}: Qty ${order.qauntity}, Status: ${order.order_status}`);
    });

    console.log('\n🎉 Test data creation completed successfully!');
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
createTestDataForDLR7()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });













