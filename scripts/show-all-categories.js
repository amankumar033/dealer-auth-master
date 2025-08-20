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

async function showAllCategories() {
  console.log('📂 Showing All Categories in Database...\n');
  
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Get all categories with dealer information
    const [categories] = await connection.execute(`
      SELECT c.*, d.name as dealer_name, d.business_name 
      FROM categories c 
      LEFT JOIN dealers d ON c.dealer_id = d.dealer_id 
      ORDER BY c.created_at DESC
    `);
    
    console.log(`📊 Total Categories Found: ${categories.length}\n`);
    
    if (categories.length > 0) {
      console.log('📋 All Categories:');
      console.log('─'.repeat(100));
      
      categories.forEach((category, index) => {
        console.log(`${index + 1}. ${category.name}`);
        console.log(`   ID: ${category.id}`);
        console.log(`   Slug: ${category.slug}`);
        console.log(`   Description: ${category.description || 'No description'}`);
        console.log(`   Status: ${category.is_active ? '✅ Active' : '❌ Inactive'}`);
        console.log(`   Featured: ${category.is_featured ? '⭐ Featured' : '📄 Regular'}`);
        console.log(`   Dealer: ${category.dealer_name || category.business_name || `ID: ${category.dealer_id}`}`);
        console.log(`   Created: ${category.created_at}`);
        console.log('─'.repeat(100));
      });
      
      // Summary by dealer
      console.log('\n📈 Summary by Dealer:');
      const dealerSummary = {};
      categories.forEach(category => {
        const dealerName = category.dealer_name || category.business_name || `Dealer ${category.dealer_id}`;
        if (!dealerSummary[dealerName]) {
          dealerSummary[dealerName] = { total: 0, active: 0, featured: 0 };
        }
        dealerSummary[dealerName].total++;
        if (category.is_active) dealerSummary[dealerName].active++;
        if (category.is_featured) dealerSummary[dealerName].featured++;
      });
      
      Object.entries(dealerSummary).forEach(([dealer, stats]) => {
        console.log(`   ${dealer}: ${stats.total} total (${stats.active} active, ${stats.featured} featured)`);
      });
      
    } else {
      console.log('❌ No categories found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Connection closed');
    }
  }
}

showAllCategories(); 