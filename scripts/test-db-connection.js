const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dealer_auth',
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function testConnection() {
  let connection;
  
  try {
    console.log('🔌 Testing database connection...');
    console.log('Config:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port
    });
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Test if Orders table exists
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Orders'
    `, [dbConfig.database]);

    if (tables.length > 0) {
      console.log('✅ Orders table exists');
      
      // Get table structure
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Orders'
        ORDER BY ORDINAL_POSITION
      `, [dbConfig.database]);

      console.log('\n📋 Orders table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_DEFAULT ? `DEFAULT ${col.COLUMN_DEFAULT}` : ''} ${col.EXTRA || ''}`);
      });
    } else {
      console.log('❌ Orders table does not exist');
    }

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n💡 Please check:');
    console.log('1. Database server is running');
    console.log('2. Database credentials are correct');
    console.log('3. Database "dealer_auth" exists');
    console.log('4. Create .env.local file with:');
    console.log('   DB_HOST=localhost');
    console.log('   DB_USER=your_username');
    console.log('   DB_PASSWORD=your_password');
    console.log('   DB_NAME=dealer_auth');
    console.log('   DB_PORT=3306');
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the test
testConnection(); 