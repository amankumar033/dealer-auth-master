const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kriptocar',
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function checkDatabaseStructure() {
  let connection;
  
  try {
    console.log('🔍 Checking Database Structure...\n');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully\n');
    
    // Check if products table exists and its structure
    console.log('1️⃣ Checking Products Table Structure...');
    try {
      const [productsColumns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products'
        ORDER BY ORDINAL_POSITION
      `, [process.env.DB_NAME || 'kriptocar']);
      
      console.log('📋 Products table columns:');
      productsColumns.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
      
      // Check if required fields exist
      const requiredFields = ['product_id', 'dealer_id', 'name', 'category_id', 'brand_name'];
      const existingFields = productsColumns.map(col => col.COLUMN_NAME);
      
      console.log('\n🔍 Checking required fields:');
      requiredFields.forEach(field => {
        if (existingFields.includes(field)) {
          console.log(`   ✅ ${field} exists`);
        } else {
          console.log(`   ❌ ${field} MISSING`);
        }
      });
      
    } catch (error) {
      console.log('❌ Products table does not exist:', error.message);
    }
    
    // Check if categories table exists
    console.log('\n2️⃣ Checking Categories Table Structure...');
    try {
      const [categoriesColumns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'categories'
        ORDER BY ORDINAL_POSITION
      `, [process.env.DB_NAME || 'kriptocar']);
      
      console.log('📋 Categories table columns:');
      categoriesColumns.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
      
    } catch (error) {
      console.log('❌ Categories table does not exist:', error.message);
    }
    
    // Check if brands table exists
    console.log('\n3️⃣ Checking Brands Table Structure...');
    try {
      const [brandsColumns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'brands'
        ORDER BY ORDINAL_POSITION
      `, [process.env.DB_NAME || 'kriptocar']);
      
      console.log('📋 Brands table columns:');
      brandsColumns.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
      
    } catch (error) {
      console.log('❌ Brands table does not exist:', error.message);
    }
    
    // Check if sub_brands table exists
    console.log('\n4️⃣ Checking Sub-Brands Table Structure...');
    try {
      const [subBrandsColumns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sub_brands'
        ORDER BY ORDINAL_POSITION
      `, [process.env.DB_NAME || 'kriptocar']);
      
      console.log('📋 Sub-brands table columns:');
      subBrandsColumns.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
      
    } catch (error) {
      console.log('❌ Sub-brands table does not exist:', error.message);
    }
    
    // Check if sub_categories table exists
    console.log('\n5️⃣ Checking Sub-Categories Table Structure...');
    try {
      const [subCategoriesColumns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sub_categories'
        ORDER BY ORDINAL_POSITION
      `, [process.env.DB_NAME || 'kriptocar']);
      
      console.log('📋 Sub-categories table columns:');
      subCategoriesColumns.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
      
    } catch (error) {
      console.log('❌ Sub-categories table does not exist:', error.message);
    }
    
    // Test a simple products query
    console.log('\n6️⃣ Testing Products Query...');
    try {
      const [products] = await connection.execute('SELECT COUNT(*) as count FROM products');
      console.log(`✅ Products table has ${products[0].count} records`);
      
      if (products[0].count > 0) {
        const [sampleProduct] = await connection.execute('SELECT * FROM products LIMIT 1');
        console.log('📋 Sample product structure:');
        Object.keys(sampleProduct[0]).forEach(key => {
          console.log(`   - ${key}: ${typeof sampleProduct[0][key]} (${sampleProduct[0][key]})`);
        });
      }
      
    } catch (error) {
      console.log('❌ Products query failed:', error.message);
    }
    
    console.log('\n🎯 Summary:');
    console.log('This script will help identify what database structure you currently have.');
    console.log('Run this script and share the output to get the exact fix needed.');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the check
checkDatabaseStructure().catch(console.error);


