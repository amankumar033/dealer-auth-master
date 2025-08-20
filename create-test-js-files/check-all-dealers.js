const mysql = require('mysql2/promise');

const dbConfig = {
  host: '82.29.162.35',
  user: 'kriptocar',
  password: 'kriptocar',
  database: 'kriptocar',
  port: 3306,
  connectTimeout: 10000,
};

async function checkAllDealers() {
  console.log('🔍 Checking all dealers in database...\n');
  
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Get all dealers
    const [dealers] = await connection.execute('SELECT dealer_id, business_name, name, email, password_hash FROM dealers ORDER BY dealer_id');
    
    console.log(`📊 Total Dealers Found: ${dealers.length}\n`);
    
    if (dealers.length > 0) {
      console.log('📋 All Dealers:');
      console.log('─'.repeat(100));
      
      let foundTarget = false;
      
      dealers.forEach((dealer, index) => {
        const isTarget = dealer.email === 'ns4@gmail.com';
        if (isTarget) foundTarget = true;
        
        console.log(`${index + 1}. ${dealer.business_name || dealer.name} ${isTarget ? '🎯' : ''}`);
        console.log(`   ID: ${dealer.dealer_id}`);
        console.log(`   Name: ${dealer.name}`);
        console.log(`   Email: ${dealer.email} ${isTarget ? '← TARGET' : ''}`);
        console.log(`   Password Hash: ${dealer.password_hash}`);
        console.log('─'.repeat(100));
      });
      
      if (!foundTarget) {
        console.log('\n❌ No dealer found with email: ns4@gmail.com');
        console.log('💡 You might want to check for similar emails or create this dealer.');
      } else {
        console.log('\n✅ Found the target dealer with ns4@gmail.com!');
      }
      
    } else {
      console.log('❌ No dealers found in database');
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

checkAllDealers(); 