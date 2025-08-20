const fetch = require('node-fetch');

async function debugCategories() {
  try {
    console.log('🔍 Debugging categories with show_all=true...');
    
    const response = await fetch('http://localhost:3000/api/categories?show_all=true');
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n📋 All categories:');
      
      if (data.categories && data.categories.length > 0) {
        data.categories.forEach((cat, index) => {
          console.log(`${index + 1}. ${cat.category_id}: "${cat.name}" (dealer_id: ${cat.dealer_id}, id: ${cat.id})`);
        });
        
        // Look for CTR5 specifically
        const ctr5 = data.categories.find(cat => cat.category_id === 'CTR5');
        if (ctr5) {
          console.log('\n🎯 Found CTR5:');
          console.log('  - category_id:', ctr5.category_id);
          console.log('  - name:', ctr5.name);
          console.log('  - dealer_id:', ctr5.dealer_id);
          console.log('  - id:', ctr5.id);
        } else {
          console.log('\n❌ CTR5 not found in the response');
        }
      } else {
        console.log('No categories found');
      }
    } else {
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugCategories().catch(console.error); 