// Check what database configuration the API is using
console.log('🔍 Checking API Database Configuration...\n');

// Simulate the environment variables that the API uses
const envVars = {
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'kriptocar',
  DB_PORT: process.env.DB_PORT || '3306',
  DB_SSL: process.env.DB_SSL || 'false'
};

console.log('📋 Environment Variables:');
Object.keys(envVars).forEach(key => {
  const value = key.includes('PASSWORD') ? '***' : envVars[key];
  console.log(`   ${key}: ${value}`);
});

console.log('\n📋 API Database Config:');
console.log(`   Host: ${envVars.DB_HOST}`);
console.log(`   User: ${envVars.DB_USER}`);
console.log(`   Database: ${envVars.DB_NAME}`);
console.log(`   Port: ${envVars.DB_PORT}`);
console.log(`   SSL: ${envVars.DB_SSL}`);

console.log('\n📋 Test Script Database Config:');
console.log(`   Host: 82.29.162.35`);
console.log(`   User: kriptocar`);
console.log(`   Database: kriptocar`);
console.log(`   Port: 3306`);

console.log('\n🔍 Comparison:');
const isSameHost = envVars.DB_HOST === '82.29.162.35';
const isSameUser = envVars.DB_USER === 'kriptocar';
const isSameDatabase = envVars.DB_NAME === 'kriptocar';
const isSamePort = envVars.DB_PORT === '3306';

console.log(`   Host match: ${isSameHost ? '✅' : '❌'}`);
console.log(`   User match: ${isSameUser ? '✅' : '❌'}`);
console.log(`   Database match: ${isSameDatabase ? '✅' : '❌'}`);
console.log(`   Port match: ${isSamePort ? '✅' : '❌'}`);

if (isSameHost && isSameUser && isSameDatabase && isSamePort) {
  console.log('\n✅ Database configurations match!');
} else {
  console.log('\n❌ Database configurations do not match!');
  console.log('   This could be causing the API to fail.');
  console.log('   The API might be trying to connect to a different database.');
}


