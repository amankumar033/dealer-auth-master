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

console.log('🔍 Database configuration:');
console.log('  - host:', dbConfig.host);
console.log('  - user:', dbConfig.user);
console.log('  - database:', dbConfig.database);
console.log('  - port:', dbConfig.port);
console.log('  - password:', dbConfig.password ? '[SET]' : '[NOT SET]');

async function testSimpleConnection() {
  let connection;
  
  try {
    console.log('\n🔌 Testing database connection...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connection successful');

    // Test a simple query
    console.log('\n📋 Testing simple query...');
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Simple query result:', rows);

    console.log('\n🎉 Database connection test passed!');

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error errno:', error.errno);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Connection refused. This usually means:');
      console.log('  - MySQL server is not running');
      console.log('  - Wrong host or port');
      console.log('  - Firewall blocking the connection');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Access denied. This usually means:');
      console.log('  - Wrong username or password');
      console.log('  - User does not have access to the database');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 Bad database. This usually means:');
      console.log('  - Database does not exist');
      console.log('  - Wrong database name');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the test
testSimpleConnection().catch(console.error); 