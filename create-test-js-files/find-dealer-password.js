const mysql = require('mysql2/promise');

const dbConfig = {
  host: '82.29.162.35',
  user: 'kriptocar',
  password: 'kriptocar',
  database: 'kriptocar',
  port: 3306,
  connectTimeout: 10000,
};

async function findDealerPassword() {
  console.log('🔍 Finding dealer with email: ns4@gmail.com\n');
  
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Find dealer with specific email
    const [dealers] = await connection.execute('SELECT * FROM dealers WHERE email = ?', ['ns4@gmail.com']);
    
    if (dealers.length > 0) {
      const dealer = dealers[0];
      console.log('✅ Dealer found!');
      console.log('─'.repeat(80));
      console.log(`Business Name: ${dealer.business_name || 'N/A'}`);
      console.log(`Name: ${dealer.name || 'N/A'}`);
      console.log(`Email: ${dealer.email}`);
      console.log(`Dealer ID: ${dealer.dealer_id}`);
      console.log(`Phone: ${dealer.phone || 'N/A'}`);
      console.log(`Password Hash: ${dealer.password_hash}`);
      console.log(`Is Verified: ${dealer.is_verified ? 'Yes' : 'No'}`);
      console.log(`Rating: ${dealer.rating || 'N/A'}`);
      console.log(`Created: ${dealer.created_at}`);
      console.log('─'.repeat(80));
      
      // If you need the plain text password, you'll need to check what the hash corresponds to
      console.log('\n💡 Note: This is the password hash. To get the plain text password,');
      console.log('   you would need to either:');
      console.log('   1. Check your application code for default passwords');
      console.log('   2. Use a password reset function');
      console.log('   3. Check if this is a known hash (like bcrypt hash for "password")');
      
    } else {
      console.log('❌ No dealer found with email: ns4@gmail.com');
      
      // Show all dealers for reference
      const [allDealers] = await connection.execute('SELECT dealer_id, business_name, name, email FROM dealers LIMIT 10');
      console.log('\n📋 Available dealers:');
      allDealers.forEach((d, i) => {
        console.log(`${i + 1}. ${d.business_name || d.name} (${d.email}) - ID: ${d.dealer_id}`);
      });
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

findDealerPassword(); 