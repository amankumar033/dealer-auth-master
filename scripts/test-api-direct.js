const fetch = require('node-fetch');

async function testApi() {
  try {
    console.log('🧪 Testing API directly...\n');
    
    const response = await fetch('http://localhost:3000/api/notifications/120/accept', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ dealer_id: 'DLR7' })
    });
    
    console.log('📋 Response Status:', response.status);
    console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📋 Response Body:', responseText);
    
    if (response.ok) {
      console.log('✅ API call successful!');
    } else {
      console.log('❌ API call failed with status:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testApi();


