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

async function checkProductsTable() {
  console.log('🔍 Checking Products Table Structure...\n');
  
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Check products table structure
    console.log('📋 Products table columns:');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'kriptocar']);
    
    columns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // Check if there are any products
    console.log('\n📊 Products count:');
    const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM products');
    console.log(`   Total products: ${countResult[0].count}`);
    
    if (countResult[0].count > 0) {
      console.log('\n📋 Sample product:');
      const [sampleProduct] = await connection.execute('SELECT * FROM products LIMIT 1');
      console.log('   Sample product keys:', Object.keys(sampleProduct[0]));
      
      // Check for dealer_id DLR7
      console.log('\n🔍 Products for dealer DLR7:');
      const [dlr7Products] = await connection.execute('SELECT COUNT(*) as count FROM products WHERE dealer_id = ?', ['DLR7']);
      console.log(`   Products for DLR7: ${dlr7Products[0].count}`);
      
      if (dlr7Products[0].count > 0) {
        const [dlr7Sample] = await connection.execute('SELECT product_id, name, dealer_id FROM products WHERE dealer_id = ? LIMIT 3', ['DLR7']);
        console.log('   Sample DLR7 products:');
        dlr7Sample.forEach(product => {
          console.log(`     - ${product.product_id}: ${product.name}`);
        });
      }
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
checkProductsTable().catch(console.error);


