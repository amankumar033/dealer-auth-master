const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kriptocar',
  port: parseInt(process.env.DB_PORT || '3306'),
  charset: 'utf8mb4',
};

async function testCategoryDisassociation() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Test 1: Check current categories
    console.log('\n📋 Test 1: Checking current categories...');
    const [categories] = await connection.execute(`
      SELECT category_id, name, dealer_id, id 
      FROM categories 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('Current categories:');
    categories.forEach(cat => {
      console.log(`  - ${cat.category_id}: "${cat.name}" (dealer_id: ${cat.dealer_id}, id: ${cat.id})`);
    });

    if (categories.length === 0) {
      console.log('❌ No categories found. Please create some categories first.');
      return;
    }

    // Test 2: Test the disassociation query directly
    const testCategory = categories[0];
    console.log(`\n🔄 Test 2: Testing disassociation on category "${testCategory.name}"...`);
    
    console.log('Before disassociation:');
    console.log(`  - dealer_id: ${testCategory.dealer_id}`);
    console.log(`  - id: ${testCategory.id}`);
    
    // Test the disassociation query
    const disassociateQuery = `
      UPDATE categories 
      SET dealer_id = NULL, id = ?, updated_at = NOW()
      WHERE category_id = ?
    `;
    
    const [updateResult] = await connection.execute(disassociateQuery, [1, testCategory.category_id]);
    console.log('Update result:', updateResult);
    
    // Check the result
    const [updatedCategories] = await connection.execute(`
      SELECT category_id, name, dealer_id, id 
      FROM categories 
      WHERE category_id = ?
    `, [testCategory.category_id]);
    
    if (updatedCategories.length > 0) {
      const updatedCategory = updatedCategories[0];
      console.log('After disassociation:');
      console.log(`  - dealer_id: ${updatedCategory.dealer_id}`);
      console.log(`  - id: ${updatedCategory.id}`);
      
      if (updatedCategory.dealer_id === null && updatedCategory.id === 1) {
        console.log('✅ Disassociation successful!');
      } else {
        console.log('❌ Disassociation failed!');
        console.log(`Expected: dealer_id = null, id = 1`);
        console.log(`Actual: dealer_id = ${updatedCategory.dealer_id}, id = ${updatedCategory.id}`);
      }
    } else {
      console.log('❌ Category not found after update');
    }

    // Test 3: Revert the change for testing
    console.log('\n🔄 Test 3: Reverting the change...');
    const revertQuery = `
      UPDATE categories 
      SET dealer_id = ?, id = ?, updated_at = NOW()
      WHERE category_id = ?
    `;
    
    await connection.execute(revertQuery, [testCategory.dealer_id, testCategory.id, testCategory.category_id]);
    console.log('✅ Reverted successfully');

    // Test 4: Check the validation logic
    console.log('\n🔍 Test 4: Testing validation logic...');
    const testData = {
      dealer_id: null,
      id: 1
    };
    
    console.log('Test data:', testData);
    console.log('dealer_id === null:', testData.dealer_id === null);
    console.log('id === 1:', testData.id === 1);

    console.log('\n🎉 All tests completed!');

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
testCategoryDisassociation().catch(console.error); 