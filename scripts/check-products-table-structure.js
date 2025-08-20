const mysql = require('mysql2/promise');

const dbConfig = {
  host: '82.29.162.35',
  user: 'kriptocar',
  password: 'kriptocar',
  database: 'kriptocar',
  port: 3306,
  connectTimeout: 10000,
};

async function checkProductsTableStructure() {
  console.log('🔍 Checking products table structure...\n');
  
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
      AND TABLE_NAME = 'products' 
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 Products Table Structure:');
    console.log('─'.repeat(80));
    columns.forEach((column, index) => {
      console.log(`${index + 1}. ${column.COLUMN_NAME} (${column.DATA_TYPE}) ${column.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    console.log('─'.repeat(80));
    
    // Check foreign key constraints
    const [constraints] = await connection.execute(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = 'kriptocar' 
      AND TABLE_NAME = 'products' 
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    console.log('\n🔗 Foreign Key Constraints:');
    console.log('─'.repeat(80));
    constraints.forEach((constraint, index) => {
      console.log(`${index + 1}. ${constraint.CONSTRAINT_NAME}`);
      console.log(`   Column: ${constraint.COLUMN_NAME}`);
      console.log(`   References: ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`);
    });
    console.log('─'.repeat(80));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Connection closed');
    }
  }
}

checkProductsTableStructure();
