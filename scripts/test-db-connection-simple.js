const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'dealer_auth',
  port: 3306,
};

async function testConnection() {
  let connection;
  
  try {
    console.log('🔌 Testing database connection...');
    console.log('Config:', { host: dbConfig.host, user: dbConfig.user, database: dbConfig.database, port: dbConfig.port });
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Test a simple query
    const [result] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query test successful:', result);

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connection closed');
    }
  }
}

testConnection();



