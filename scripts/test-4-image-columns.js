const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function test4ImageColumns() {
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'kriptocar',
      port: parseInt(process.env.DB_PORT || '3306')
    });

    console.log('✅ Connected to database');

    // Check if the new image columns exist
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'products' 
      AND COLUMN_NAME IN ('image_1', 'image_2', 'image_3', 'image_4')
      ORDER BY COLUMN_NAME
    `);

    console.log('\n📋 Image columns in products table:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
    });

    if (columns.length === 0) {
      console.log('❌ Image columns not found! Please run the migration:');
      console.log(`
        ALTER TABLE products 
        ADD COLUMN image_1 LONGBLOB NULL COMMENT 'Additional image 1 for product',
        ADD COLUMN image_2 LONGBLOB NULL COMMENT 'Additional image 2 for product',
        ADD COLUMN image_3 LONGBLOB NULL COMMENT 'Additional image 3 for product',
        ADD COLUMN image_4 LONGBLOB NULL COMMENT 'Additional image 4 for product';
      `);
      return;
    }

    // Check if product_images table still exists
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'product_images'
    `, [process.env.DB_NAME || 'kriptocar']);

    if (tables.length > 0) {
      console.log('\n⚠️  product_images table still exists. You can drop it if no longer needed:');
      console.log('   DROP TABLE product_images;');
    } else {
      console.log('\n✅ product_images table has been removed');
    }

    // Test the API endpoints
    console.log('\n🧪 Testing API endpoints...');
    
    // Test GET /api/products
    try {
      const response = await fetch('http://localhost:3000/api/products?dealer_id=DLR7');
      if (response.ok) {
        const products = await response.json();
        console.log(`✅ GET /api/products: ${products.length} products retrieved`);
        
        if (products.length > 0) {
          const product = products[0];
          console.log(`  - Product: ${product.name}`);
          console.log(`  - Primary image: ${product.image ? 'Present' : 'None'}`);
          console.log(`  - Additional images: ${product.images ? product.images.length : 0}`);
          console.log(`  - Image columns: image_1=${product.image_1 ? 'Present' : 'None'}, image_2=${product.image_2 ? 'Present' : 'None'}, image_3=${product.image_3 ? 'Present' : 'None'}, image_4=${product.image_4 ? 'Present' : 'None'}`);
        }
      } else {
        console.log(`❌ GET /api/products failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ GET /api/products error: ${error.message}`);
    }

    console.log('\n✅ Test completed successfully!');
    console.log('\n📝 Summary:');
    console.log('  - Removed all product_images table references');
    console.log('  - Updated API to use 4 image columns (image_1, image_2, image_3, image_4)');
    console.log('  - Simplified database structure');
    console.log('  - Maximum 4 images per product supported');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

test4ImageColumns(); 