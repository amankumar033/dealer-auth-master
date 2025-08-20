const bcrypt = require('bcryptjs');

async function generatePassword() {
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 12);
  console.log('Password:', password);
  console.log('Hashed Password:', hashedPassword);
}

generatePassword().catch(console.error); 