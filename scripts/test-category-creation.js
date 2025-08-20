const mysql = require('mysql2/promise');
const fs = require('fs');

// Load environment variables manually
function loadEnvFile(filePath) {
  const env = {};
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    content.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    });
  }
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

async function testCategoryCreation() {
  console.log('🧪 Testing Category Creation...\n');
  
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Get a dealer ID to test with
    const [dealers] = await connection.execute('SELECT dealer_id FROM dealers LIMIT 1');
    if (dealers.length === 0) {
      console.log('❌ No dealers found in database');
      return;
    }
    
    const dealerId = dealers[0].dealer_id;
    console.log(`Using dealer_id: ${dealerId}`);
    
    // Count categories before
    const [beforeCount] = await connection.execute('SELECT COUNT(*) as count FROM categories WHERE dealer_id = ?', [dealerId]);
    console.log(`Categories before: ${beforeCount[0].count}`);
    
    // Test category creation
    const testCategory = {
      name: 'Test Category ' + Date.now(),
      description: 'This is a test category',
      is_active: 1,
      is_featured: 0,
      dealer_id: dealerId
    };
    
    // Generate slug
    const slug = testCategory.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    console.log(`Creating category: ${testCategory.name} with slug: ${slug}`);
    
    // Insert category
    const [result] = await connection.execute(`
      INSERT INTO categories (name, slug, description, is_active, is_featured, dealer_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [testCategory.name, slug, testCategory.description, testCategory.is_active, testCategory.is_featured, testCategory.dealer_id]);
    
    console.log('✅ Category created successfully');
    console.log(`Insert ID: ${result.insertId}`);
    
    // Verify the category was created
    const [newCategory] = await connection.execute('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    if (newCategory.length > 0) {
      console.log('✅ Category found in database:');
      console.log(`  ID: ${newCategory[0].id}`);
      console.log(`  Name: ${newCategory[0].name}`);
      console.log(`  Slug: ${newCategory[0].slug}`);
      console.log(`  Description: ${newCategory[0].description}`);
      console.log(`  Dealer ID: ${newCategory[0].dealer_id}`);
    } else {
      console.log('❌ Category not found after creation');
    }
    
    // Count categories after
    const [afterCount] = await connection.execute('SELECT COUNT(*) as count FROM categories WHERE dealer_id = ?', [dealerId]);
    console.log(`Categories after: ${afterCount[0].count}`);
    
    // Clean up - delete the test category
    await connection.execute('DELETE FROM categories WHERE id = ?', [result.insertId]);
    console.log('✅ Test category cleaned up');
    
    console.log('\n🎉 Category creation test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nError details:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Connection closed');
    }
  }
}

testCategoryCreation(); 