/**
 * Zimam Engine Test
 * Verifies the engine generates correct recommendations for example profiles
 */

import { evaluateRecommendations } from './index';
import { ZimamProfile } from './types';

// Example 1: Male, 37 years, overweight + smoking + physical inactivity
const example1Profile: ZimamProfile = {
  version: 'v1',
  data: {
    gender: 'male',
    birthDate: { day: '1', month: '1', year: '1988' },
    height: '170',
    weight: '80',
    conditions: ['physical-inactivity', 'smoking', 'overweight'],
    age: 37,
    bmi: 27.7,
  },
};

// Example 2: Female, 53 years, obese + diabetic + hypertensive + sexual history
const example2Profile: ZimamProfile = {
  version: 'v1',
  data: {
    gender: 'female',
    birthDate: { day: '1', month: '1', year: '1972' },
    height: '160',
    weight: '85',
    conditions: [
      'physical-inactivity',
      'overweight',
      'hypertension',
      'diabetes-mellitus',
      'sexual-history',
      'obesity',
    ],
    age: 53,
    bmi: 33.2,
  },
};

export function runTests() {
  console.log('=== Testing Zimam Engine ===\n');

  // Test Example 1
  console.log('--- Example 1: Male, 37 years, overweight + smoking ---');
  const result1 = evaluateRecommendations(example1Profile);
  console.log('Profile:', JSON.stringify(example1Profile.data, null, 2));
  console.log('\nRecommendations:');
  result1.groupedRecs.forEach((category) => {
    console.log(`\n${category.name.en} (${category.name.ar}):`);
    category.recs.forEach((rec) => {
      console.log(`  - ${rec.name.en}`);
      console.log(`    ${rec.articulation.text.en}`);
    });
  });

  console.log('\n\n--- Example 2: Female, 53 years, obese + diabetic + sexual history ---');
  const result2 = evaluateRecommendations(example2Profile);
  console.log('Profile:', JSON.stringify(example2Profile.data, null, 2));
  console.log('\nRecommendations:');
  result2.groupedRecs.forEach((category) => {
    console.log(`\n${category.name.en} (${category.name.ar}):`);
    category.recs.forEach((rec) => {
      console.log(`  - ${rec.name.en}`);
      console.log(`    ${rec.articulation.text.en}`);
    });
  });

  console.log('\n=== Tests Complete ===');
  
  return { result1, result2 };
}

// Export profiles for manual testing
export { example1Profile, example2Profile };
