const mysql = require('mysql2/promise');

const dbConfig = {
  host: '82.29.162.35',
  user: 'kriptocar',
  password: 'kriptocar',
  database: 'kriptocar',
  port: 3306,
  connectTimeout: 10000,
};

async function checkCurrentDealer() {
  console.log('🔍 Checking current dealer authentication...\n');
  
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Check all dealers
    const [dealers] = await connection.execute('SELECT dealer_id, business_name, name, email FROM dealers ORDER BY dealer_id');
    
    console.log('📋 All Available Dealers:');
    console.log('─'.repeat(80));
    dealers.forEach((dealer, index) => {
      console.log(`${index + 1}. ${dealer.dealer_id} - ${dealer.business_name} (${dealer.name}) - ${dealer.email}`);
    });
    console.log('─'.repeat(80));
    
    // Check which dealers have products
    const [dealersWithProducts] = await connection.execute(`
      SELECT DISTINCT d.dealer_id, d.business_name, d.name, d.email, COUNT(p.product_id) as product_count
      FROM dealers d
      LEFT JOIN products p ON d.dealer_id = p.dealer_id
      GROUP BY d.dealer_id, d.business_name, d.name, d.email
      ORDER BY product_count DESC, d.dealer_id
    `);
    
    console.log('\n📊 Dealers with Products:');
    console.log('─'.repeat(80));
    dealersWithProducts.forEach((dealer, index) => {
      console.log(`${index + 1}. ${dealer.dealer_id} - ${dealer.business_name} (${dealer.name}) - ${dealer.product_count} products`);
    });
    console.log('─'.repeat(80));
    
    // Check recent product creation attempts
    console.log('\n🔍 Recent Product Creation Activity:');
    console.log('─'.repeat(80));
    
    // Check if there are any failed product insertions in the logs
    // (This would require checking application logs, but we can check for recent products)
    
    const [recentProducts] = await connection.execute(`
      SELECT product_id, dealer_id, name, created_at 
      FROM products 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    if (recentProducts.length > 0) {
      console.log('Recent Products Created:');
      recentProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.product_id} - ${product.name} (Dealer: ${product.dealer_id}) - ${product.created_at}`);
      });
    } else {
      console.log('No products found in database');
    }
    
    // Test specific dealer IDs that might be causing issues
    console.log('\n🧪 Testing Common Dealer IDs:');
    console.log('─'.repeat(80));
    
    const testDealerIds = ['DLR7', 'DLR1', 'DLR8', 'DLR9', 'DLR91'];
    
    for (const testId of testDealerIds) {
      const [dealer] = await connection.execute('SELECT dealer_id, business_name, name FROM dealers WHERE dealer_id = ?', [testId]);
      
      if (dealer.length > 0) {
        const dealerInfo = dealer[0];
        console.log(`✅ ${testId} - EXISTS: ${dealerInfo.business_name} (${dealerInfo.name})`);
        
        // Check if this dealer has products
        const [products] = await connection.execute('SELECT COUNT(*) as count FROM products WHERE dealer_id = ?', [testId]);
        console.log(`   📦 Products: ${products[0].count}`);
        
      } else {
        console.log(`❌ ${testId} - NOT FOUND in dealers table`);
      }
    }
    
    console.log('\n💡 Recommendations:');
    console.log('─'.repeat(80));
    console.log('1. Make sure you are logged in with a valid dealer account');
    console.log('2. Check that the dealer_id in your session exists in the database');
    console.log('3. Try logging out and logging back in');
    console.log('4. If using DLR7, make sure you are logged in as that dealer');
    console.log('5. Check browser console for any authentication errors');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Connection closed');
    }
  }
}

checkCurrentDealer();
