const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvFile(filePath) {
  try {
    const envContent = fs.readFileSync(filePath, 'utf8');
    const env = {};
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    });
    
    return env;
  } catch (error) {
    console.log('No .env.local file found, using default values');
    return {};
  }
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

async function removeCreatedAtFromCategories() {
  console.log('🗑️ Removing created_at column from categories table...\n');
  
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // First, check if the created_at column exists
    console.log('🔍 Checking if created_at column exists...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'created_at'
    `, [dbConfig.database]);
    
    if (columns.length === 0) {
      console.log('❌ created_at column does not exist in categories table');
      return;
    }
    
    console.log('✅ found_at column found:', columns[0]);
    
    // Show current table structure
    console.log('\n📋 Current categories table structure:');
    const [currentStructure] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'categories'
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);
    
    currentStructure.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'} ${col.COLUMN_DEFAULT ? `DEFAULT ${col.COLUMN_DEFAULT}` : ''}`);
    });
    
    // Remove the created_at column
    console.log('\n🗑️ Removing created_at column...');
    await connection.execute(`
      ALTER TABLE categories DROP COLUMN created_at
    `);
    console.log('✅ created_at column removed successfully!');
    
    // Show updated table structure
    console.log('\n📋 Updated categories table structure:');
    const [updatedStructure] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'categories'
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);
    
    updatedStructure.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'} ${col.COLUMN_DEFAULT ? `DEFAULT ${col.COLUMN_DEFAULT}` : ''}`);
    });
    
    // Verify the column was removed
    const [verifyColumns] = await connection.execute(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'created_at'
    `, [dbConfig.database]);
    
    if (verifyColumns.length === 0) {
      console.log('\n✅ Verification successful: created_at column has been completely removed');
    } else {
      console.log('\n❌ Verification failed: created_at column still exists');
    }
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error removing created_at column:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
removeCreatedAtFromCategories()
  .then(() => {
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });

