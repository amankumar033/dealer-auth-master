// Check email configuration
console.log('🔍 Checking Email Configuration...\n');

// Check environment variables
const emailConfig = {
  EMAIL_HOST: process.env.EMAIL_HOST || 'NOT SET',
  EMAIL_PORT: process.env.EMAIL_PORT || 'NOT SET',
  EMAIL_USER: process.env.EMAIL_USER || 'NOT SET',
  EMAIL_PASS: process.env.EMAIL_PASS ? 'SET (hidden)' : 'NOT SET'
};

console.log('📋 Email Environment Variables:');
Object.keys(emailConfig).forEach(key => {
  console.log(`   ${key}: ${emailConfig[key]}`);
});

console.log('\n📋 Email Configuration Status:');
const isHostSet = emailConfig.EMAIL_HOST !== 'NOT SET';
const isPortSet = emailConfig.EMAIL_PORT !== 'NOT SET';
const isUserSet = emailConfig.EMAIL_USER !== 'NOT SET';
const isPassSet = emailConfig.EMAIL_PASS !== 'NOT SET';

console.log(`   Host configured: ${isHostSet ? '✅' : '❌'}`);
console.log(`   Port configured: ${isPortSet ? '✅' : '❌'}`);
console.log(`   User configured: ${isUserSet ? '✅' : '❌'}`);
console.log(`   Password configured: ${isPassSet ? '✅' : '❌'}`);

if (isHostSet && isPortSet && isUserSet && isPassSet) {
  console.log('\n✅ All email configuration is set!');
  console.log('📧 Emails should work properly.');
} else {
  console.log('\n❌ Email configuration is incomplete!');
  console.log('📧 You need to create a .env.local file with email credentials.');
  console.log('\n📋 Required .env.local content:');
  console.log('EMAIL_HOST=smtp.gmail.com');
  console.log('EMAIL_PORT=587');
  console.log('EMAIL_USER=your-email@gmail.com');
  console.log('EMAIL_PASS=your-app-password');
}

console.log('\n📋 Database Configuration Status:');
const dbConfig = {
  DB_HOST: process.env.DB_HOST || 'NOT SET',
  DB_USER: process.env.DB_USER || 'NOT SET',
  DB_PASSWORD: process.env.DB_PASSWORD ? 'SET (hidden)' : 'NOT SET',
  DB_NAME: process.env.DB_NAME || 'NOT SET'
};

Object.keys(dbConfig).forEach(key => {
  console.log(`   ${key}: ${dbConfig[key]}`);
});

const isDbHostSet = dbConfig.DB_HOST !== 'NOT SET';
const isDbUserSet = dbConfig.DB_USER !== 'NOT SET';
const isDbPassSet = dbConfig.DB_PASSWORD !== 'NOT SET';
const isDbNameSet = dbConfig.DB_NAME !== 'NOT SET';

console.log('\n📋 Database Configuration Status:');
console.log(`   Host configured: ${isDbHostSet ? '✅' : '❌'}`);
console.log(`   User configured: ${isDbUserSet ? '✅' : '❌'}`);
console.log(`   Password configured: ${isDbPassSet ? '✅' : '❌'}`);
console.log(`   Database configured: ${isDbNameSet ? '✅' : '❌'}`);

if (isDbHostSet && isDbUserSet && isDbPassSet && isDbNameSet) {
  console.log('\n✅ Database configuration is set!');
} else {
  console.log('\n❌ Database configuration is incomplete!');
  console.log('📧 You need to create a .env.local file with database credentials.');
}


