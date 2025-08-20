const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: '82.29.162.35',
  user: 'kriptocar',
  password: 'kriptocar',
  database: 'kriptocar',
  port: 3306,
};

async function checkDatabaseData() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Check dealers
    console.log('\n📋 Checking dealers table...');
    const [dealers] = await connection.execute('SELECT dealer_id, business_name FROM dealers LIMIT 5');
    console.log(`Found ${dealers.length} dealers:`);
    dealers.forEach(dealer => {
      console.log(`  - ${dealer.dealer_id}: ${dealer.business_name}`);
    });

    // Check products
    console.log('\n📦 Checking products table...');
    const [products] = await connection.execute('SELECT product_id, dealer_id, name FROM products LIMIT 5');
    console.log(`Found ${products.length} products:`);
    products.forEach(product => {
      console.log(`  - ${product.product_id}: ${product.name} (Dealer: ${product.dealer_id})`);
    });

    // Check orders
    console.log('\n📋 Checking orders table...');
    const [orders] = await connection.execute('SELECT order_id, dealer_id, user_id, qauntity FROM orders LIMIT 5');
    console.log(`Found ${orders.length} orders:`);
    orders.forEach(order => {
      console.log(`  - ${order.order_id}: Dealer ${order.dealer_id}, User ${order.user_id}, Qty: ${order.qauntity}`);
    });

    // Check categories
    console.log('\n📂 Checking categories table...');
    const [categories] = await connection.execute('SELECT category_id, name, dealer_id FROM categories LIMIT 5');
    console.log(`Found ${categories.length} categories:`);
    categories.forEach(category => {
      console.log(`  - ${category.category_id}: ${category.name} (Dealer: ${category.dealer_id})`);
    });

    // Check specific dealer data
    console.log('\n🔍 Checking data for dealer DLR7...');
    const [dealer7Products] = await connection.execute('SELECT product_id, name FROM products WHERE dealer_id = ?', ['DLR7']);
    console.log(`Dealer DLR7 has ${dealer7Products.length} products:`);
    dealer7Products.forEach(product => {
      console.log(`  - ${product.product_id}: ${product.name}`);
    });

    const [dealer7Orders] = await connection.execute('SELECT order_id, qauntity FROM orders WHERE dealer_id = ?', ['DLR7']);
    console.log(`Dealer DLR7 has ${dealer7Orders.length} orders:`);
    dealer7Orders.forEach(order => {
      console.log(`  - ${order.order_id}: Qty ${order.qauntity}`);
    });

    console.log('\n🎉 Database data check completed!');

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

// Run the check
checkDatabaseData()
  .then(() => {
    console.log('\n✅ Check completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });













