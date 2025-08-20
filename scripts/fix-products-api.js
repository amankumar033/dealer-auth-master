const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kriptocar',
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function fixProductsAPI() {
  let connection;
  
  try {
    console.log('🔧 Fixing Products API...\n');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully\n');
    
    // Step 1: Check current products table structure
    console.log('1️⃣ Checking current products table structure...');
    const [productsColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'kriptocar']);
    
    const existingFields = productsColumns.map(col => col.COLUMN_NAME);
    console.log('📋 Current fields:', existingFields);
    
    // Step 2: Add missing fields if they don't exist
    console.log('\n2️⃣ Adding missing fields...');
    
    const requiredFields = [
      { name: 'brand_name', type: 'VARCHAR(255)', default: "'Unknown'" },
      { name: 'sub_brand_name', type: 'VARCHAR(255)', default: 'NULL' },
      { name: 'sub_category_id', type: 'VARCHAR(255)', default: 'NULL' }
    ];
    
    for (const field of requiredFields) {
      if (!existingFields.includes(field.name)) {
        try {
          await connection.execute(`
            ALTER TABLE products 
            ADD COLUMN ${field.name} ${field.type} DEFAULT ${field.default}
          `);
          console.log(`   ✅ Added ${field.name}`);
        } catch (error) {
          console.log(`   ⚠️ Could not add ${field.name}:`, error.message);
        }
      } else {
        console.log(`   ✅ ${field.name} already exists`);
      }
    }
    
    // Step 3: Create brands table if it doesn't exist
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
    
    // Step 4: Create sub_brands table if it doesn't exist
    console.log('\n4️⃣ Creating sub_brands table...');
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS sub_brands (
          sub_brand_name VARCHAR(255) PRIMARY KEY,
          brand_name VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (brand_name) REFERENCES brands(brand_name)
        )
      `);
      console.log('   ✅ Sub-brands table created/verified');
    } catch (error) {
      console.log('   ⚠️ Could not create sub_brands table:', error.message);
    }
    
    // Step 5: Update existing products to have brand_name if they don't have it
    console.log('\n5️⃣ Updating existing products...');
    try {
      // Check if there are products with NULL brand_name
      const [productsWithNullBrand] = await connection.execute(`
        SELECT COUNT(*) as count FROM products WHERE brand_name IS NULL OR brand_name = ''
      `);
      
      if (productsWithNullBrand[0].count > 0) {
        console.log(`   📝 Found ${productsWithNullBrand[0].count} products without brand_name`);
        
        // Update them to have 'Unknown' brand
        await connection.execute(`
          UPDATE products SET brand_name = 'Unknown' 
          WHERE brand_name IS NULL OR brand_name = ''
        `);
        console.log('   ✅ Updated products with default brand_name');
      } else {
        console.log('   ✅ All products already have brand_name');
      }
    } catch (error) {
      console.log('   ⚠️ Could not update products:', error.message);
    }
    
    // Step 6: Add some default brands
    console.log('\n6️⃣ Adding default brands...');
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
    
    // Step 7: Test the products query
    console.log('\n7️⃣ Testing products query...');
    try {
      const [products] = await connection.execute(`
        SELECT p.*, d.business_name, d.name as dealer_name, d.phone as dealer_phone,
               c.name as category_name, sc.name as sub_category_name
        FROM products p 
        LEFT JOIN dealers d ON p.dealer_id = d.dealer_id
        LEFT JOIN categories c ON p.category_id = c.category_id
        LEFT JOIN sub_categories sc ON p.sub_category_id = sc.sub_category_id
        WHERE p.dealer_id = ? 
        ORDER BY p.created_at DESC
        LIMIT 5
      `, ['DLR7']); // Test with a sample dealer ID
      
      console.log(`   ✅ Query successful, found ${products.length} products`);
      if (products.length > 0) {
        console.log('   📋 Sample product fields:', Object.keys(products[0]));
      }
      
    } catch (error) {
      console.log('   ❌ Query failed:', error.message);
      
      // Try a simpler query
      try {
        const [simpleProducts] = await connection.execute('SELECT * FROM products LIMIT 1');
        console.log('   ✅ Simple query works, found', simpleProducts.length, 'products');
      } catch (simpleError) {
        console.log('   ❌ Even simple query failed:', simpleError.message);
      }
    }
    
    console.log('\n🎉 Database structure fix completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Restart your Next.js application');
    console.log('2. Try accessing the products page again');
    console.log('3. If you still get errors, run the check-db-structure.js script');
    
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
fixProductsAPI().catch(console.error);


