const bcrypt = require('bcryptjs');

async function testPassword() {
  const hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
  
  // Test common passwords
  const passwords = ['password', 'password123', '123456', 'admin', 'test'];
  
  console.log('Testing password hash:', hash);
  console.log('─'.repeat(50));
  
  for (const password of passwords) {
    const isValid = await bcrypt.compare(password, hash);
    console.log(`Password "${password}": ${isValid ? '✅ MATCH!' : '❌'}`);
  }
  
  // Generate hash for password123
  const password123Hash = await bcrypt.hash('password123', 12);
  console.log('\nHash for "password123":', password123Hash);
}

testPassword().catch(console.error); 