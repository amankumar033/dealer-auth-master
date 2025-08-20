const mysql = require('mysql2/promise');

// Database configuration - use the same as your app
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kriptocar',
  port: parseInt(process.env.DB_PORT || '3306'),
  charset: 'utf8mb4',
};

async function testDirectCategoryDisassociation() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Test data - replace with actual values
    const categoryId = 'CTR11'; // Replace with actual category ID
    const dealerId = 'DLR7';   // Replace with actual dealer ID
    
    console.log(`\n📋 Testing category disassociation for:`);
    console.log(`  - category_id: ${categoryId}`);
    console.log(`  - dealer_id: ${dealerId}`);

    // Step 1: Check current state
    console.log('\n🔍 Step 1: Checking current category state...');
    const [currentCategories] = await connection.execute(`
      SELECT category_id, name, dealer_id, id 
      FROM categories 
      WHERE category_id = ?
    `, [categoryId]);
    
    if (currentCategories.length === 0) {
      console.log('❌ Category not found!');
      return;
    }
    
    const currentCategory = currentCategories[0];
    console.log('Current category state:');
    console.log(`  - category_id: ${currentCategory.category_id}`);
    console.log(`  - name: ${currentCategory.name}`);
    console.log(`  - dealer_id: ${currentCategory.dealer_id}`);
    console.log(`  - id: ${currentCategory.id}`);

    // Step 2: Check if there are products in this category
    console.log('\n📦 Step 2: Checking products in this category...');
    const [products] = await connection.execute(`
      SELECT product_id, name, dealer_id 
      FROM products 
      WHERE category_id = ?
    `, [categoryId]);
    
    console.log(`Found ${products.length} products in this category:`);
    products.forEach(prod => {
      console.log(`  - ${prod.product_id}: "${prod.name}" (dealer_id: ${prod.dealer_id})`);
    });

    // Step 3: Delete products for this dealer
    console.log('\n🗑️ Step 3: Deleting products for this dealer...');
    const [deleteResult] = await connection.execute(`
      DELETE FROM products 
      WHERE category_id = ? AND dealer_id = ?
    `, [categoryId, dealerId]);
    
    console.log(`Deleted ${deleteResult.affectedRows} products for dealer ${dealerId}`);

    // Step 4: Update category to disassociate
    console.log('\n🔄 Step 4: Disassociating category...');
    const [updateResult] = await connection.execute(`
      UPDATE categories 
      SET dealer_id = NULL, id = 1, updated_at = NOW()
      WHERE category_id = ?
    `, [categoryId]);
    
    console.log(`Update result: ${updateResult.affectedRows} rows affected`);

    // Step 5: Verify the changes
    console.log('\n✅ Step 5: Verifying changes...');
    const [updatedCategories] = await connection.execute(`
      SELECT category_id, name, dealer_id, id 
      FROM categories 
      WHERE category_id = ?
    `, [categoryId]);
    
    if (updatedCategories.length > 0) {
      const updatedCategory = updatedCategories[0];
      console.log('Updated category state:');
      console.log(`  - category_id: ${updatedCategory.category_id}`);
      console.log(`  - name: ${updatedCategory.name}`);
      console.log(`  - dealer_id: ${updatedCategory.dealer_id}`);
      console.log(`  - id: ${updatedCategory.id}`);
      
      // Check if disassociation was successful
      if (updatedCategory.dealer_id === null && updatedCategory.id === 1) {
        console.log('\n🎉 SUCCESS: Category disassociation worked correctly!');
        console.log('  - dealer_id is now null');
        console.log('  - id is now 1');
      } else {
        console.log('\n❌ FAILED: Category disassociation did not work as expected');
        console.log(`  - Expected: dealer_id = null, id = 1`);
        console.log(`  - Actual: dealer_id = ${updatedCategory.dealer_id}, id = ${updatedCategory.id}`);
      }
    } else {
      console.log('❌ Category not found after update');
    }

    // Step 6: Check remaining products
    console.log('\n📦 Step 6: Checking remaining products...');
    const [remainingProducts] = await connection.execute(`
      SELECT product_id, name, dealer_id 
      FROM products 
      WHERE category_id = ?
    `, [categoryId]);
    
    console.log(`Remaining products in category: ${remainingProducts.length}`);
    remainingProducts.forEach(prod => {
      console.log(`  - ${prod.product_id}: "${prod.name}" (dealer_id: ${prod.dealer_id})`);
    });

    console.log('\n🎉 Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the test
testDirectCategoryDisassociation().catch(console.error); 