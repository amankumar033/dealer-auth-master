const mysql = require('mysql2/promise');

const dbConfig = {
  host: '82.29.162.35',
  user: 'kriptocar',
  password: 'kriptocar',
  database: 'kriptocar',
  port: 3306,
  connectTimeout: 10000,
};

async function createDealerDLR10() {
  console.log('🔧 Creating new dealer with ID: DLR10\n');
  
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
    
    // Create new dealer with DLR10
    const newDealer = {
      dealer_id: 'DLR10',
      business_name: 'Premium Auto Services',
      name: 'John Smith',
      email: 'john.smith@premiumauto.com',
      password_hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
      phone: '9876543210',
      business_address: '456 Premium Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      tax_id: 'TAX987654',
      service_pincodes: '400001,400002,400003',
      service_types: 'PPF,Seat Cover,Tyre,Oil Change',
      is_verified: true,
      rating: 4.8
    };
    
    console.log('Creating dealer with data:', {
      dealer_id: newDealer.dealer_id,
      business_name: newDealer.business_name,
      name: newDealer.name,
      email: newDealer.email,
      phone: newDealer.phone
    });
    
    // Insert the new dealer
    await connection.execute(`
      INSERT INTO dealers (
        dealer_id, business_name, name, email, password_hash, phone, business_address,
        city, state, pincode, tax_id, service_pincodes, service_types, is_verified, rating,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      newDealer.dealer_id,
      newDealer.business_name,
      newDealer.name,
      newDealer.email,
      newDealer.password_hash,
      newDealer.phone,
      newDealer.business_address,
      newDealer.city,
      newDealer.state,
      newDealer.pincode,
      newDealer.tax_id,
      newDealer.service_pincodes,
      newDealer.service_types,
      newDealer.is_verified,
      newDealer.rating
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
      console.log(`Phone: ${dealer.phone}`);
      console.log(`City: ${dealer.city}, ${dealer.state}`);
      console.log(`Is Verified: ${dealer.is_verified ? 'Yes' : 'No'}`);
      console.log(`Rating: ${dealer.rating}`);
      console.log(`Created: ${dealer.created_at}`);
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

createDealerDLR10(); 