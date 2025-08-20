// Test API slug generation
const BASE_URL = 'http://localhost:3000/api';

async function testApiSlugGeneration() {
  console.log('🔧 Testing API slug generation...\n');

  const testProducts = [
    {
      name: 'Engine Oil',
      description: 'High-quality engine oil for optimal performance',
      short_description: 'Premium engine oil',
      sale_price: 29.99,
      original_price: 39.99,
      rating: 4.5,
      category_id: 'CTR1_123456',
      brand: 'Mobil',
      stock_quantity: 100,
      dealer_id: 'DLR7_123456'
    },
    {
      name: 'Engine Oil', // Duplicate name
      description: 'Synthetic engine oil for modern engines',
      short_description: 'Synthetic engine oil',
      sale_price: 34.99,
      original_price: 44.99,
      rating: 4.8,
      category_id: 'CTR1_123456',
      brand: 'Castrol',
      stock_quantity: 75,
      dealer_id: 'DLR7_123456'
    },
    {
      name: 'Engine Oil', // Another duplicate
      description: 'Premium synthetic engine oil',
      short_description: 'Premium synthetic oil',
      sale_price: 39.99,
      original_price: 49.99,
      rating: 4.9,
      category_id: 'CTR1_123456',
      brand: 'Shell',
      stock_quantity: 50,
      dealer_id: 'DLR7_123456'
    }
  ];

  console.log('📝 Testing product creation with slug generation:\n');

  for (let i = 0; i < testProducts.length; i++) {
    const product = testProducts[i];
    console.log(`${i + 1}. Creating product: "${product.name}"`);
    
    try {
      const response = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`   ✅ Product created successfully`);
        console.log(`   🔗 Generated slug: "${result.product.slug}"`);
        console.log(`   🆔 Product ID: ${result.product.product_id}`);
      } else {
        const error = await response.json();
        console.log(`   ❌ Failed to create product: ${error.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Network error: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('✅ API slug generation test completed!');
}

// Run the test
testApiSlugGeneration().catch(console.error);

