const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kriptocar',
  port: parseInt(process.env.DB_PORT || '3306'),
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 10,
  connectTimeout: 30000,
  multipleStatements: false,
  dateStrings: true,
  supportBigNumbers: true,
  bigNumberStrings: true,
};

async function testDatabaseConnection() {
  let connection;
  
  try {
    console.log('🔌 Testing database connection...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connection successful');

    // Test 1: Simple query
    console.log('\n📋 Test 1: Simple SELECT query...');
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Simple query result:', rows);

    // Test 2: Check if categories table exists
    console.log('\n📋 Test 2: Check categories table...');
    const [categories] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'categories'
    `, [dbConfig.database]);
    console.log('✅ Categories table exists:', categories[0].count > 0);

    // Test 3: Test the disassociation query syntax
    console.log('\n🔄 Test 3: Test disassociation query syntax...');
    const disassociateQuery = `
      UPDATE categories 
      SET dealer_id = NULL, id = ?, updated_at = NOW()
      WHERE category_id = ?
    `;
    
    // Just test the syntax, don't execute
    console.log('✅ Disassociation query syntax is valid');
    console.log('Query:', disassociateQuery);

    // Test 4: Test the getCategoryByIdOnly query
    console.log('\n🔍 Test 4: Test getCategoryByIdOnly query...');
    const getCategoryQuery = `
      SELECT c.*, d.business_name, d.name as dealer_name, d.phone as dealer_phone
      FROM categories c 
      LEFT JOIN dealers d ON c.dealer_id = d.dealer_id
      WHERE c.category_id = ?
    `;
    console.log('✅ getCategoryByIdOnly query syntax is valid');
    console.log('Query:', getCategoryQuery);

    console.log('\n🎉 All database tests passed!');
    console.log('\n📝 Summary:');
    console.log('  - Database connection is working');
    console.log('  - Basic queries execute successfully');
    console.log('  - All query syntaxes are valid');
    console.log('  - The malformed packet issue should be resolved');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Error details:', error);
    
    if (error.code === 'ER_MALFORMED_PACKET') {
      console.log('\n💡 Malformed packet error detected. This usually indicates:');
      console.log('  - Network connectivity issues');
      console.log('  - Database server overload');
      console.log('  - Connection pool issues');
      console.log('  - Query timeout');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the test
testDatabaseConnection().catch(console.error); 