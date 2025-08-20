// Test the slug generation logic without database connection
function generateBaseSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Simulate unique slug generation with existing slugs
function generateUniqueSlug(existingSlugs, name) {
  const baseSlug = generateBaseSlug(name);
  
  // Filter existing slugs that match the base slug pattern
  const matchingSlugs = existingSlugs.filter(slug => slug.startsWith(baseSlug));
  
  if (matchingSlugs.length === 0) {
    return baseSlug;
  }
  
  // Find the highest number suffix
  let maxNumber = 0;
  matchingSlugs.forEach(slug => {
    if (slug === baseSlug) {
      maxNumber = Math.max(maxNumber, 1);
    } else if (slug.startsWith(baseSlug) && slug !== baseSlug) {
      const suffix = slug.substring(baseSlug.length);
      const number = parseInt(suffix);
      if (!isNaN(number)) {
        maxNumber = Math.max(maxNumber, number);
      }
    }
  });
  
  // Return slug with next available number
  return maxNumber === 0 ? baseSlug : `${baseSlug}${maxNumber + 1}`;
}

// Test scenarios
console.log('🔧 Testing unique slug generation logic...\n');

// Scenario 1: No existing slugs
console.log('📝 Scenario 1: No existing slugs');
let existingSlugs = [];
const testProducts1 = ['Engine Oil', 'Motor Oil 5W-30', 'Brake Pads & Rotors'];

testProducts1.forEach(product => {
  const uniqueSlug = generateUniqueSlug(existingSlugs, product);
  existingSlugs.push(uniqueSlug);
  console.log(`   "${product}" → "${uniqueSlug}"`);
});

console.log('\n📝 Scenario 2: Adding duplicates');
const testProducts2 = ['Engine Oil', 'Engine Oil', 'Engine Oil', 'Motor Oil 5W-30', 'Motor Oil 5W-30'];

testProducts2.forEach(product => {
  const uniqueSlug = generateUniqueSlug(existingSlugs, product);
  existingSlugs.push(uniqueSlug);
  console.log(`   "${product}" → "${uniqueSlug}"`);
});

console.log('\n📝 Scenario 3: Mixed scenarios');
const testProducts3 = ['Spark Plugs NGK', 'Spark Plugs NGK', 'Spark Plugs NGK', 'Tire Pressure Sensor'];

testProducts3.forEach(product => {
  const uniqueSlug = generateUniqueSlug(existingSlugs, product);
  existingSlugs.push(uniqueSlug);
  console.log(`   "${product}" → "${uniqueSlug}"`);
});

console.log('\n📋 Final list of all slugs:');
existingSlugs.forEach((slug, index) => {
  console.log(`   ${index + 1}. "${slug}"`);
});

console.log('\n✅ Slug generation logic test completed!');

// Test specific edge cases
console.log('\n🎯 Testing edge cases:');
const edgeCases = [
  'Engine Oil',
  'engine-oil',
  'Engine Oil',
  'engine-oil2',
  'Engine Oil',
  'engine-oil3',
  'Engine Oil'
];

let edgeCaseSlugs = [];
edgeCases.forEach(product => {
  const uniqueSlug = generateUniqueSlug(edgeCaseSlugs, product);
  edgeCaseSlugs.push(uniqueSlug);
  console.log(`   "${product}" → "${uniqueSlug}"`);
});

