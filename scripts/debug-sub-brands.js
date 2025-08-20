const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kriptocar',
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function debugSubBrands() {
  let connection;
  
  try {
    console.log('🔍 Debugging Sub-Brands API...\n');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully\n');
    
    // Check if sub_brands table exists
    console.log('1️⃣ Checking sub_brands table...');
    const [tables] = await connection.execute(`
      SHOW TABLES LIKE 'sub_brands'
    `);
    
    if (tables.length === 0) {
      console.log('❌ sub_brands table does not exist!');
      return;
    }
    console.log('✅ sub_brands table exists\n');
    
    // Check table structure
    console.log('2️⃣ Checking sub_brands table structure...');
    const [columns] = await connection.execute(`
      DESCRIBE sub_brands
    `);
    console.log('📋 Table columns:');
    columns.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
    });
    console.log();
    
    // Check if table has data
    console.log('3️⃣ Checking sub_brands data...');
    const [subBrands] = await connection.execute(`
      SELECT * FROM sub_brands LIMIT 10
    `);
    
    console.log(`📊 Found ${subBrands.length} sub-brands:`);
    subBrands.forEach((subBrand, index) => {
      console.log(`   ${index + 1}. ${JSON.stringify(subBrand)}`);
    });
    console.log();
    
    // Test the exact query that the API uses
    console.log('4️⃣ Testing API query for brand "TVS Mot"...');
    const [apiResult] = await connection.execute(`
      SELECT * FROM sub_brands WHERE brand_name = ?
    `, ['TVS Mot']);
    
    console.log(`📊 API query result for "TVS Mot": ${apiResult.length} records`);
    apiResult.forEach((item, index) => {
      console.log(`   ${index + 1}. ${JSON.stringify(item)}`);
    });
    console.log();
    
    // Check for any NULL or invalid data
    console.log('5️⃣ Checking for NULL or invalid data...');
    const [nullCheck] = await connection.execute(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN sub_brand_name IS NULL THEN 1 ELSE 0 END) as null_sub_brand_name,
             SUM(CASE WHEN brand_name IS NULL THEN 1 ELSE 0 END) as null_brand_name
      FROM sub_brands
    `);
    
    console.log('📊 Data quality check:');
    console.log(`   - Total records: ${nullCheck[0].total}`);
    console.log(`   - Records with NULL sub_brand_name: ${nullCheck[0].null_sub_brand_name}`);
    console.log(`   - Records with NULL brand_name: ${nullCheck[0].null_brand_name}`);
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the debug
debugSubBrands().catch(console.error);


