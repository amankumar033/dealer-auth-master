// Test the database connection using the same config as the running app
const mysql = require('mysql2/promise');

// Try different database configurations
const configs = [
  {
    name: 'Default config (no env vars)',
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kriptocar',
    port: 3306,
    charset: 'utf8mb4',
  },
  {
    name: 'Alternative config',
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'kriptocar',
    port: 3306,
    charset: 'utf8mb4',
  },
  {
    name: 'With password',
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'kriptocar',
    port: 3306,
    charset: 'utf8mb4',
  }
];

async function testConfig(config) {
  console.log(`\n🔍 Testing: ${config.name}`);
  console.log(`  - host: ${config.host}:${config.port}`);
  console.log(`  - user: ${config.user}`);
  console.log(`  - database: ${config.database}`);
  console.log(`  - password: ${config.password ? '[SET]' : '[NOT SET]'}`);
  
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log(`  ✅ Connection successful!`);
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log(`  ✅ Query test passed:`, rows);
    
    // Test if database exists
    const [databases] = await connection.execute('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === config.database);
    console.log(`  ✅ Database '${config.database}' exists: ${dbExists}`);
    
    if (dbExists) {
      // Test if tables exist
      await connection.execute(`USE ${config.database}`);
      const [tables] = await connection.execute('SHOW TABLES');
      console.log(`  ✅ Tables found:`, tables.map(t => Object.values(t)[0]));
    }
    
    return true;
  } catch (error) {
    console.log(`  ❌ Connection failed: ${error.code} - ${error.message}`);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function testAllConfigs() {
  console.log('🧪 Testing database configurations...');
  
  for (const config of configs) {
    const success = await testConfig(config);
    if (success) {
      console.log(`\n🎉 Found working configuration: ${config.name}`);
      console.log('You can use this configuration in your .env.local file:');
      console.log(`DB_HOST=${config.host}`);
      console.log(`DB_USER=${config.user}`);
      console.log(`DB_PASSWORD=${config.password || ''}`);
      console.log(`DB_NAME=${config.database}`);
      console.log(`DB_PORT=${config.port}`);
      return;
    }
  }
  
  console.log('\n❌ No working database configuration found.');
  console.log('\n💡 To fix this, you need to:');
  console.log('1. Install MySQL server');
  console.log('2. Start MySQL service');
  console.log('3. Create a database named "kriptocar"');
  console.log('4. Create a .env.local file with your database credentials');
}

testAllConfigs().catch(console.error); 