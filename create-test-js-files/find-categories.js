const fetch = require('node-fetch');

async function findCategories() {
  try {
    console.log('🔍 Finding existing categories...');
    
    // Get all categories
    const response = await fetch('http://localhost:3000/api/categories?show_all=true');
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n📋 Found categories:');
      
      if (data.categories && data.categories.length > 0) {
        data.categories.forEach((cat, index) => {
          console.log(`${index + 1}. ${cat.category_id}: "${cat.name}" (dealer_id: ${cat.dealer_id}, id: ${cat.id})`);
        });
        
        // Get the first category for testing
        const testCategory = data.categories[0];
        console.log(`\n🧪 Using category "${testCategory.name}" (${testCategory.category_id}) for testing`);
        
        // Test disassociation
        console.log('\n🔄 Testing disassociation...');
        const putResponse = await fetch(`http://localhost:3000/api/categories/${testCategory.category_id}?dealer_id=${testCategory.dealer_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dealer_id: null,
            id: 1
          })
        });
        
        console.log('PUT Response status:', putResponse.status);
        
        if (putResponse.ok) {
          const result = await putResponse.json();
          console.log('✅ Disassociation successful!');
          console.log('Updated category:', {
            category_id: result.category?.category_id,
            name: result.category?.name,
            dealer_id: result.category?.dealer_id,
            id: result.category?.id
          });
          
          if (result.category?.dealer_id === null && result.category?.id === 1) {
            console.log('🎉 SUCCESS: dealer_id is null and id is 1!');
          } else {
            console.log('❌ FAILED: Values not updated correctly');
          }
        } else {
          const errorText = await putResponse.text();
          console.log('❌ Disassociation failed:', errorText);
        }
        
      } else {
        console.log('No categories found');
      }
    } else {
      const errorText = await response.text();
      console.log('Error fetching categories:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findCategories().catch(console.error); 