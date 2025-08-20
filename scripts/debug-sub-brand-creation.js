const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: '82.29.162.35',
  user: 'kriptocar',
  password: 'kriptocar',
  database: 'kriptocar',
  port: 3306,
  connectTimeout: 10000,
};

async function debugSubBrandCreation() {
  let connection;
  
  try {
    console.log('🔍 Debugging Sub-Brand Creation...\n');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');
    
    // Test data
    const testSubBrandName = 'Test Sub Brand';
    const testBrandName = 'Test Brand';
    
    console.log('📋 Test Data:');
    console.log('   Sub-Brand Name:', testSubBrandName);
    console.log('   Brand Name:', testBrandName);
    
    // Step 1: Check if brand exists
    console.log('\n📋 Step 1: Check if brand exists...');
    const [brands] = await connection.execute(
      'SELECT * FROM brands WHERE brand_name = ?',
      [testBrandName]
    );
    
    if (brands.length === 0) {
      console.log('❌ Brand does not exist!');
      console.log('   This is why the API returns 400');
      
      // Show available brands
      const [allBrands] = await connection.execute('SELECT brand_name FROM brands LIMIT 10');
      console.log('   Available brands:');
      allBrands.forEach(brand => {
        console.log(`     - ${brand.brand_name}`);
      });
      return;
    }
    
    console.log('✅ Brand exists');
    
    // Step 2: Check if sub-brand already exists
    console.log('\n📋 Step 2: Check if sub-brand already exists...');
    const [existingSubBrands] = await connection.execute(
      'SELECT * FROM sub_brands WHERE sub_brand_name = ?',
      [testSubBrandName]
    );
    
    if (existingSubBrands.length > 0) {
      console.log('❌ Sub-brand already exists!');
      console.log('   This would return 409, not 400');
      return;
    }
    
    console.log('✅ Sub-brand does not exist');
    
    // Step 3: Check table structure
    console.log('\n📋 Step 3: Check sub_brands table structure...');
    const [columns] = await connection.execute('DESCRIBE sub_brands');
    console.log('   Sub-brands table columns:');
    columns.forEach(col => {
      console.log(`     - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : '(NULL)'}`);
    });
    
    // Step 4: Test insertion
    console.log('\n📋 Step 4: Test insertion...');
    try {
      await connection.execute(
        'INSERT INTO sub_brands (sub_brand_name, brand_name) VALUES (?, ?)',
        [testSubBrandName, testBrandName]
      );
      console.log('✅ Insertion successful');
      
      // Clean up
      await connection.execute(
        'DELETE FROM sub_brands WHERE sub_brand_name = ?',
        [testSubBrandName]
      );
      console.log('✅ Cleanup successful');
      
    } catch (error) {
      console.log('❌ Insertion failed:', error.message);
      return;
    }
    
    console.log('\n✅ All checks passed!');
    console.log('✅ The issue might be in the API route logic or data being sent');
    
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
debugSubBrandCreation().catch(console.error);
