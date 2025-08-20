const mysql = require('mysql2/promise');

const dbConfig = {
  host: '82.29.162.35',
  user: 'kriptocar',
  password: 'kriptocar',
  database: 'kriptocar',
  port: 3306,
  connectTimeout: 10000,
};

async function checkDealersTableStructure() {
  console.log('🔍 Checking dealers table structure...\n');
  
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Get table structure
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'kriptocar' 
      AND TABLE_NAME = 'dealers' 
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 Dealers Table Structure:');
    console.log('─'.repeat(80));
    columns.forEach((column, index) => {
      console.log(`${index + 1}. ${column.COLUMN_NAME} (${column.DATA_TYPE}) ${column.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    console.log('─'.repeat(80));
    
    // Also show a sample dealer record
    const [sampleDealer] = await connection.execute('SELECT * FROM dealers LIMIT 1');
    if (sampleDealer.length > 0) {
      console.log('\n📋 Sample Dealer Record:');
      console.log('─'.repeat(80));
      Object.entries(sampleDealer[0]).forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });
      console.log('─'.repeat(80));
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

checkDealersTableStructure(); 