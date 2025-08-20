const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dealer_auth',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function checkDealersAndProducts() {
  let connection;
  
  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Check all dealers
    console.log('\n📋 CHECKING ALL DEALERS:');
    const [dealers] = await connection.execute('SELECT dealer_id, business_name, name, email FROM dealers');
    console.log('Dealers found:', dealers.length);
    dealers.forEach(dealer => {
      console.log(`  - ${dealer.dealer_id}: ${dealer.business_name} (${dealer.name}) - ${dealer.email}`);
    });

    // Check all products
    console.log('\n📦 CHECKING ALL PRODUCTS:');
    const [products] = await connection.execute('SELECT product_id, name, dealer_id, category_id, sale_price FROM products');
    console.log('Products found:', products.length);
    products.forEach(product => {
      console.log(`  - ${product.product_id}: ${product.name} (Dealer: ${product.dealer_id}, Category: ${product.category_id}) - ₹${product.sale_price}`);
    });

    // Check products by specific dealer
    console.log('\n🔍 CHECKING PRODUCTS BY DEALER DLR7:');
    const [dlr7Products] = await connection.execute('SELECT product_id, name, dealer_id, category_id, sale_price FROM products WHERE dealer_id = ?', ['DLR7']);
    console.log('DLR7 Products found:', dlr7Products.length);
    dlr7Products.forEach(product => {
      console.log(`  - ${product.product_id}: ${product.name} (Category: ${product.category_id}) - ₹${product.sale_price}`);
    });

    // Check if dealer_id=6 exists
    console.log('\n🔍 CHECKING IF DEALER_ID=6 EXISTS:');
    const [dealer6] = await connection.execute('SELECT dealer_id, business_name, name, email FROM dealers WHERE dealer_id = ?', ['6']);
    if (dealer6.length > 0) {
      console.log('Dealer 6 found:', dealer6[0]);
    } else {
      console.log('❌ No dealer with dealer_id=6 found');
    }

    // Check products for dealer_id=6
    console.log('\n🔍 CHECKING PRODUCTS FOR DEALER_ID=6:');
    const [dealer6Products] = await connection.execute('SELECT product_id, name, dealer_id, category_id, sale_price FROM products WHERE dealer_id = ?', ['6']);
    console.log('Dealer 6 Products found:', dealer6Products.length);
    dealer6Products.forEach(product => {
      console.log(`  - ${product.product_id}: ${product.name} (Category: ${product.category_id}) - ₹${product.sale_price}`);
    });

  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

// Run the check
checkDealersAndProducts().catch(console.error); 