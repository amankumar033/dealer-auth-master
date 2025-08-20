const mysql = require('mysql2/promise');
require('dotenv').config();

async function optimizeDatabase() {
  let connection;
  
  try {
    console.log('🔧 Optimizing database configuration...');
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'dealer_auth',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to database');

    // Optimize MySQL configuration for better performance
    const optimizations = [
      // Increase sort buffer size to prevent "Out of sort memory" errors
      "SET SESSION sort_buffer_size = 2097152", // 2MB
      
      // Increase join buffer size for better JOIN performance
      "SET SESSION join_buffer_size = 1048576", // 1MB
      
      // Increase read buffer size
      "SET SESSION read_buffer_size = 1048576", // 1MB
      
      // Increase read rnd buffer size
      "SET SESSION read_rnd_buffer_size = 2097152", // 2MB
      
      // Set SQL mode to be more permissive
      "SET SESSION sql_mode = 'NO_ENGINE_SUBSTITUTION'",
      
      // Increase timeout for long-running queries
      "SET SESSION wait_timeout = 28800", // 8 hours
      
      // Increase interactive timeout
      "SET SESSION interactive_timeout = 28800", // 8 hours
      
      // Set character set
      "SET SESSION character_set_client = 'utf8mb4'",
      "SET SESSION character_set_connection = 'utf8mb4'",
      "SET SESSION character_set_results = 'utf8mb4'"
    ];

    console.log('🔧 Applying database optimizations...');
    
    for (const optimization of optimizations) {
      try {
        await connection.execute(optimization);
        console.log(`✅ Applied: ${optimization}`);
      } catch (error) {
        console.warn(`⚠️ Warning applying ${optimization}:`, error.message);
      }
    }

    // Test the optimizations with a simple query
    console.log('🧪 Testing optimizations...');
    const [testResult] = await connection.execute('SELECT 1 as test');
    console.log('✅ Test query successful:', testResult);

    // Check current settings
    console.log('📊 Current database settings:');
    const [settings] = await connection.execute(`
      SELECT 
        @@sort_buffer_size as sort_buffer_size,
        @@join_buffer_size as join_buffer_size,
        @@read_buffer_size as read_buffer_size,
        @@read_rnd_buffer_size as read_rnd_buffer_size,
        @@wait_timeout as wait_timeout,
        @@interactive_timeout as interactive_timeout
    `);
    
    console.table(settings);

    console.log('✅ Database optimization completed successfully!');
    console.log('💡 Note: These settings are session-specific. For permanent changes,');
    console.log('   update your MySQL configuration file (my.cnf or my.ini)');

  } catch (error) {
    console.error('❌ Database optimization failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the optimization if this script is executed directly
if (require.main === module) {
  optimizeDatabase()
    .then(() => {
      console.log('🎉 Database optimization script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database optimization script failed:', error);
      process.exit(1);
    });
}

module.exports = { optimizeDatabase };
