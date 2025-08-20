const mysql = require('mysql2/promise');

const dbConfig = {
  host: '82.29.162.35',
  user: 'kriptocar',
  password: 'kriptocar',
  database: 'kriptocar',
  port: 3306,
  connectTimeout: 30000,
};

async function testConnection() {
  console.log('Testing connection...');
  console.log('Config:', { host: dbConfig.host, user: dbConfig.user, database: dbConfig.database });
  
  let connection;
  
  try {
    console.log('Connecting...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected!');
    
    // Test simple query
    const [result] = await connection.execute('SELECT COUNT(*) as count FROM dealers');
    console.log('Dealers count:', result[0].count);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Connection closed');
    }
  }
}

testConnection(); 