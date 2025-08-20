const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kriptocar',
  port: parseInt(process.env.DB_PORT || '3306'),
  charset: 'utf8mb4',
  connectTimeout: 10000,
  acquireTimeout: 30000,
  timeout: 30000
};

async function checkDatabaseHealth() {
  console.log('🔍 Database Health Check');
  console.log('=======================');
  console.log(`Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`Database: ${dbConfig.database}`);
  console.log(`User: ${dbConfig.user}`);
  console.log('');
  
  let connection;
  
  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic connection...');
    const startTime = Date.now();
    connection = await mysql.createConnection(dbConfig);
    const connectTime = Date.now() - startTime;
    
    console.log(`✅ Connection successful (${connectTime}ms)`);
    
    // Test 2: Ping test
    console.log('2️⃣ Testing ping...');
    await connection.ping();
    console.log('✅ Ping successful');
    
    // Test 3: Simple query
    console.log('3️⃣ Testing simple query...');
    const [result] = await connection.execute('SELECT 1 as test, NOW() as timestamp');
    console.log('✅ Query successful:', result[0]);
    
    // Test 4: Check database exists
    console.log('4️⃣ Checking database access...');
    const [databases] = await connection.execute('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === dbConfig.database);
    
    if (dbExists) {
      console.log(`✅ Database '${dbConfig.database}' exists`);
    } else {
      console.log(`❌ Database '${dbConfig.database}' not found`);
      console.log('Available databases:', databases.map(db => db.Database).join(', '));
    }
    
    // Test 5: Check tables
    if (dbExists) {
      console.log('5️⃣ Checking tables...');
      const [tables] = await connection.execute(`
        SELECT TABLE_NAME, TABLE_ROWS 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ?
      `, [dbConfig.database]);
      
      console.log(`✅ Found ${tables.length} tables in database`);
      tables.forEach(table => {
        console.log(`   - ${table.TABLE_NAME}: ${table.TABLE_ROWS || 0} rows`);
      });
    }
    
    // Test 6: Check server variables
    console.log('6️⃣ Checking server configuration...');
    const [variables] = await connection.execute(`
      SHOW VARIABLES WHERE Variable_name IN 
      ('max_connections', 'wait_timeout', 'interactive_timeout', 'connect_timeout')
    `);
    
    console.log('✅ Server configuration:');
    variables.forEach(variable => {
      console.log(`   - ${variable.Variable_name}: ${variable.Value}`);
    });
    
    // Test 7: Check connection status
    console.log('7️⃣ Checking connection status...');
    const [status] = await connection.execute(`
      SHOW STATUS WHERE Variable_name IN 
      ('Threads_connected', 'Max_used_connections', 'Connections')
    `);
    
    console.log('✅ Connection status:');
    status.forEach(stat => {
      console.log(`   - ${stat.Variable_name}: ${stat.Value}`);
    });
    
    console.log('\n🎉 All tests passed! Database is healthy.');
    
  } catch (error) {
    console.error('\n❌ Database health check failed:');
    console.error(`Error: ${error.message}`);
    console.error(`Code: ${error.code}`);
    console.error(`Errno: ${error.errno}`);
    console.error(`SQL State: ${error.sqlState}`);
    
    // Provide troubleshooting steps based on error type
    console.log('\n🔧 TROUBLESHOOTING STEPS:');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('1. Check if MySQL server is running:');
      console.log('   - Windows: Open Services app and check "MySQL" service');
      console.log('   - Linux/Mac: sudo systemctl status mysql');
      console.log('2. Verify the port is correct (default: 3306)');
      console.log('3. Check firewall settings');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('1. Verify username and password are correct');
      console.log('2. Check if user has access to the database');
      console.log('3. Try connecting with MySQL client to test credentials');
    } else if (error.code === 'ENOTFOUND') {
      console.log('1. Check if the hostname is correct');
      console.log('2. Verify DNS resolution');
      console.log('3. Try using IP address instead of hostname');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('1. Check network connectivity');
      console.log('2. Verify firewall settings');
      console.log('3. Try increasing connection timeout');
    } else {
      console.log('1. Check MySQL server logs for more details');
      console.log('2. Verify database configuration');
      console.log('3. Try connecting with a different MySQL client');
    }
    
    console.log('\n📋 ENVIRONMENT VARIABLES:');
    console.log(`DB_HOST: ${process.env.DB_HOST || 'not set'}`);
    console.log(`DB_PORT: ${process.env.DB_PORT || 'not set'}`);
    console.log(`DB_USER: ${process.env.DB_USER || 'not set'}`);
    console.log(`DB_NAME: ${process.env.DB_NAME || 'not set'}`);
    console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? '***set***' : 'not set'}`);
    
  } finally {
    if (connection) {
      try {
        await connection.end();
        console.log('\n🔌 Connection closed');
      } catch (error) {
        console.error('❌ Error closing connection:', error.message);
      }
    }
  }
}

// Run the health check
checkDatabaseHealth().catch(console.error); 