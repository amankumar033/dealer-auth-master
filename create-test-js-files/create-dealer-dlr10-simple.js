const mysql = require('mysql2/promise');

const dbConfig = {
  host: '82.29.162.35',
  user: 'kriptocar',
  password: 'kriptocar',
  database: 'kriptocar',
  port: 3306,
  connectTimeout: 10000,
};

async function createDealerDLR10Simple() {
  console.log('🔧 Creating new dealer with ID: DLR10 (Simple version)\n');
  
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Check if dealer DLR10 already exists
    const [existingDealers] = await connection.execute('SELECT dealer_id FROM dealers WHERE dealer_id = ?', ['DLR10']);
    
    if (existingDealers.length > 0) {
      console.log('❌ Dealer DLR10 already exists!');
      return;
    }
    
    // First, let's see what columns exist by checking an existing dealer
    const [sampleDealer] = await connection.execute('SELECT * FROM dealers LIMIT 1');
    if (sampleDealer.length > 0) {
      console.log('📋 Available columns in dealers table:');
      Object.keys(sampleDealer[0]).forEach((column, index) => {
        console.log(`${index + 1}. ${column}`);
      });
    }
    
    // Try with minimal fields first
    console.log('\n🔧 Attempting to create dealer with minimal fields...');
    
    await connection.execute(`
      INSERT INTO dealers (
        dealer_id, 
        business_name, 
        name, 
        email, 
        password_hash
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      'DLR10',
      'Premium Auto Services',
      'John Smith',
      'john.smith@premiumauto.com',
      '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
    ]);
    
    console.log('✅ Dealer DLR10 created successfully!');
    
    // Verify the dealer was created
    const [createdDealer] = await connection.execute('SELECT * FROM dealers WHERE dealer_id = ?', ['DLR10']);
    
    if (createdDealer.length > 0) {
      const dealer = createdDealer[0];
      console.log('\n📋 New Dealer Details:');
      console.log('─'.repeat(80));
      console.log(`Dealer ID: ${dealer.dealer_id}`);
      console.log(`Business Name: ${dealer.business_name}`);
      console.log(`Name: ${dealer.name}`);
      console.log(`Email: ${dealer.email}`);
      console.log('─'.repeat(80));
      
      console.log('\n🔑 Login Credentials:');
      console.log(`Email: ${dealer.email}`);
      console.log('Password: password');
    }
    
  } catch (error) {
    console.error('❌ Error creating dealer:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Connection closed');
    }
  }
}

createDealerDLR10Simple(); 