// Simple slug generation function for testing
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Test cases
const testCases = [
  'Engine Oil',
  'Motor Oil 5W-30',
  'Brake Pads & Rotors',
  'Air Filter (Premium)',
  'Spark Plugs NGK',
  'Tire Pressure Sensor',
  'Oil Filter - High Performance',
  'Windshield Wiper Blades',
  'Battery Terminal Connector',
  'Radiator Coolant/Antifreeze',
  'Transmission Fluid ATF',
  'Power Steering Fluid',
  'Clutch Kit Assembly',
  'Fuel Pump Module',
  'Oxygen Sensor (O2)',
  'Catalytic Converter',
  'Muffler & Exhaust Pipe',
  'Shock Absorber Set',
  'Strut Assembly Complete',
  'Control Arm Bushings'
];

console.log('🔧 Testing slug generation...\n');

testCases.forEach((productName, index) => {
  const slug = generateSlug(productName);
  console.log(`${index + 1}. "${productName}" → "${slug}"`);
});

console.log('\n✅ Slug generation test completed!');

// Test specific cases mentioned by user
console.log('\n🎯 User-specific test cases:');
console.log(`"Engine Oil" → "${generateSlug('Engine Oil')}"`);
console.log(`"Motor Oil 5W-30" → "${generateSlug('Motor Oil 5W-30')}"`);
console.log(`"Brake Pads & Rotors" → "${generateSlug('Brake Pads & Rotors')}"`);

