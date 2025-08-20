const { generateSlug } = require('../src/lib/database.ts');

// Test cases for slug generation
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
  try {
    // Import the generateSlug function
    const slug = generateSlug(productName);
    console.log(`${index + 1}. "${productName}" → "${slug}"`);
  } catch (error) {
    console.error(`❌ Error generating slug for "${productName}":`, error);
  }
});

console.log('\n✅ Slug generation test completed!');

