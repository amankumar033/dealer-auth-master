const mysql = require('mysql2/promise');

// Load environment variables
function loadEnvFile(filePath) {
  const fs = require('fs');
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Environment file not found: ${filePath}`);
    return {};
  }
  
  const envFile = fs.readFileSync(filePath, 'utf8');
  const env = {};
  
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return env;
}

const env = loadEnvFile('.env.local');

const dbConfig = {
  host: env.DB_HOST || 'localhost',
  user: env.DB_USER || 'root',
  password: env.DB_PASSWORD || '',
  database: env.DB_NAME || 'kriptocar',
  port: parseInt(env.DB_PORT || '3306'),
  connectTimeout: 10000,
};

async function checkDealersWithProducts() {
  console.log('🔍 Checking Dealers with Products...\n');
  
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Check which dealers have products
    console.log('📊 Dealers with products:');
    const [dealersWithProducts] = await connection.execute(`
      SELECT p.dealer_id, COUNT(*) as product_count
      FROM products p
      GROUP BY p.dealer_id
      ORDER BY product_count DESC
    `);
    
    dealersWithProducts.forEach(dealer => {
      console.log(`   - Dealer ${dealer.dealer_id}: ${dealer.product_count} products`);
    });
    
    // Check all dealers
    console.log('\n📊 All dealers:');
    const [allDealers] = await connection.execute('SELECT dealer_id, name, business_name FROM dealers LIMIT 10');
    allDealers.forEach(dealer => {
      console.log(`   - ${dealer.dealer_id}: ${dealer.name} (${dealer.business_name})`);
    });
    
    // Check if DLR7 exists
    console.log('\n🔍 Checking if DLR7 exists:');
    const [dlr7Check] = await connection.execute('SELECT dealer_id, name, business_name FROM dealers WHERE dealer_id = ?', ['DLR7']);
    if (dlr7Check.length > 0) {
      console.log(`   ✅ DLR7 exists: ${dlr7Check[0].name} (${dlr7Check[0].business_name})`);
    } else {
      console.log('   ❌ DLR7 does not exist');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the script
checkDealersWithProducts().catch(console.error);

