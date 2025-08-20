const mysql = require('mysql2/promise');

const dbConfig = {
  host: '82.29.162.35',
  user: 'kriptocar',
  password: 'kriptocar',
  database: 'kriptocar',
  port: 3306,
  connectTimeout: 10000,
};

async function checkLoginCredentials() {
  console.log('🔑 Checking login credentials for DLR7...\n');
  
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Get DLR7 details
    const [dealers] = await connection.execute('SELECT * FROM dealers WHERE dealer_id = ?', ['DLR7']);
    
    if (dealers.length > 0) {
      const dealer = dealers[0];
      
      console.log('📋 DLR7 Dealer Details:');
      console.log('─'.repeat(80));
      console.log(`Dealer ID: ${dealer.dealer_id}`);
      console.log(`Business Name: ${dealer.business_name}`);
      console.log(`Name: ${dealer.name}`);
      console.log(`Email: ${dealer.email}`);
      console.log(`Phone: ${dealer.phone}`);
      console.log(`Is Verified: ${dealer.is_verified ? 'Yes' : 'No'}`);
      console.log(`Rating: ${dealer.rating}`);
      console.log('─'.repeat(80));
      
      console.log('\n🔑 Login Credentials:');
      console.log('─'.repeat(80));
      console.log(`Email: ${dealer.email}`);
      console.log(`Password: (check your password or reset it)`);
      console.log('─'.repeat(80));
      
      // Check if this dealer has products
      const [products] = await connection.execute('SELECT COUNT(*) as count FROM products WHERE dealer_id = ?', ['DLR7']);
      console.log(`\n📦 Products: ${products[0].count} products`);
      
      if (products[0].count > 0) {
        const [recentProducts] = await connection.execute(`
          SELECT product_id, name, created_at 
          FROM products 
          WHERE dealer_id = ? 
          ORDER BY created_at DESC 
          LIMIT 3
        `, ['DLR7']);
        
        console.log('\n📋 Recent Products:');
        recentProducts.forEach((product, index) => {
          console.log(`${index + 1}. ${product.product_id} - ${product.name} (${product.created_at})`);
        });
      }
      
      console.log('\n💡 Instructions:');
      console.log('─'.repeat(80));
      console.log('1. Go to: http://localhost:3000/auth/sign-in');
      console.log(`2. Login with email: ${dealer.email}`);
      console.log('3. Use your password (or reset it if needed)');
      console.log('4. After login, try creating a product again');
      console.log('5. The product creation should work with DLR7');
      
    } else {
      console.log('❌ DLR7 not found in database');
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

checkLoginCredentials();
