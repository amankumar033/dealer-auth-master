const mysql = require('mysql2/promise');

// Load environment variables
function loadEnvFile(filePath) {
  const fs = require('fs');
  const path = require('path');
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Environment file not found: ${filePath}`);
    return {};
  }
  
  const envFile = fs.readFileSync(filePath, 'utf8');
  const env = {};
  
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return env;
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

async function removeCreatedAtColumn() {
  console.log('🗑️ Removing created_at column from categories table...\n');
  
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // First, check if the column exists
    console.log('🔍 Checking if created_at column exists...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'created_at'
    `, [process.env.DB_NAME || 'kriptocar']);
    
    if (columns.length === 0) {
      console.log('ℹ️ created_at column does not exist in categories table');
      return;
    }
    
    console.log('✅ created_at column found, removing it...');
    
    // Remove the created_at column
    await connection.execute(`
      ALTER TABLE categories DROP COLUMN created_at
    `);
    
    console.log('✅ Successfully removed created_at column from categories table');
    
    // Verify the column was removed
    const [remainingColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'categories'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'kriptocar']);
    
    console.log('\n📋 Current categories table structure:');
    remainingColumns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME}`);
    });
    
    console.log('\n✅ created_at column removal completed successfully!');
    
  } catch (error) {
    console.error('❌ Error removing created_at column:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the script
removeCreatedAtColumn().catch(console.error);

