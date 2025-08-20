const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kriptocar',
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function tempApiFix() {
  let connection;
  
  try {
    console.log('🔧 Applying Temporary API Fix...\n');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully\n');
    
    // Step 1: Check what fields actually exist in products table
    console.log('1️⃣ Checking current products table...');
    const [productsColumns] = await connection.execute(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'kriptocar']);
    
    const existingFields = productsColumns.map(col => col.COLUMN_NAME);
    console.log('📋 Existing fields:', existingFields);
    
    // Step 2: Add brand_name field if it doesn't exist
    if (!existingFields.includes('brand_name')) {
      console.log('\n2️⃣ Adding brand_name field...');
      try {
        await connection.execute(`
          ALTER TABLE products ADD COLUMN brand_name VARCHAR(255) DEFAULT 'Unknown'
        `);
        console.log('   ✅ Added brand_name field');
      } catch (error) {
        console.log('   ⚠️ Could not add brand_name:', error.message);
      }
    } else {
      console.log('   ✅ brand_name field already exists');
    }
    
    // Step 3: Create brands table
    console.log('\n3️⃣ Creating brands table...');
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS brands (
          brand_name VARCHAR(255) PRIMARY KEY,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✅ Brands table created/verified');
    } catch (error) {
      console.log('   ⚠️ Could not create brands table:', error.message);
    }
    
    // Step 4: Add some default brands
    console.log('\n4️⃣ Adding default brands...');
    const defaultBrands = ['Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes-Benz', 'Unknown'];
    
    for (const brand of defaultBrands) {
      try {
        await connection.execute(`
          INSERT IGNORE INTO brands (brand_name) VALUES (?)
        `, [brand]);
        console.log(`   ✅ Added brand: ${brand}`);
      } catch (error) {
        console.log(`   ⚠️ Could not add brand ${brand}:`, error.message);
      }
    }
    
    // Step 5: Update existing products to have brand_name
    console.log('\n5️⃣ Updating existing products...');
    try {
      const [productsWithNullBrand] = await connection.execute(`
        SELECT COUNT(*) as count FROM products WHERE brand_name IS NULL OR brand_name = ''
      `);
      
      if (productsWithNullBrand[0].count > 0) {
        await connection.execute(`
          UPDATE products SET brand_name = 'Unknown' 
          WHERE brand_name IS NULL OR brand_name = ''
        `);
        console.log(`   ✅ Updated ${productsWithNullBrand[0].count} products with default brand_name`);
      } else {
        console.log('   ✅ All products already have brand_name');
      }
    } catch (error) {
      console.log('   ⚠️ Could not update products:', error.message);
    }
    
    // Step 6: Test a simple products query
    console.log('\n6️⃣ Testing products query...');
    try {
      const [products] = await connection.execute('SELECT * FROM products LIMIT 1');
      console.log(`   ✅ Simple query works, found ${products.length} products`);
      
      if (products.length > 0) {
        console.log('   📋 Sample product fields:', Object.keys(products[0]));
      }
    } catch (error) {
      console.log('   ❌ Simple query failed:', error.message);
    }
    
    console.log('\n🎉 Temporary fix completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Restart your Next.js application');
    console.log('2. Try accessing the products page again');
    console.log('3. The API should now work with the basic structure');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the fix
tempApiFix().catch(console.error);


