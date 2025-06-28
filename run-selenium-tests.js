#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const seleniumTests = [
  { name: 'Login Tests', file: 'test-login.js' },
  { name: 'Layout & Navigation Tests', file: 'selenium-layout-tests.js' },
  { name: 'Students Page Tests', file: 'selenium-students-tests.js' },
  { name: 'Classes Tests', file: 'selenium-classes-tests.js' },
  { name: 'Classes Booking Tests', file: 'selenium-classes-booking-tests.js' },
  { name: 'Attendance Tests', file: 'selenium-attendance-tests.js' }
];

function runTest(testFile) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Running ${testFile}...`);
    console.log('='.repeat(50));
    
    const child = spawn('node', [testFile], {
      cwd: __dirname,
      stdio: 'inherit'
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${testFile} completed successfully`);
        resolve();
      } else {
        console.log(`\n❌ ${testFile} failed with exit code ${code}`);
        reject(new Error(`Test failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      console.log(`\n❌ Failed to start ${testFile}: ${error.message}`);
      reject(error);
    });
  });
}

async function runAllTests() {
  console.log('🧪 Starting All Selenium Tests...\n');
  console.log('Make sure both servers are running:');
  console.log('  - Backend: npm run dev (port 5000)');
  console.log('  - Frontend: cd client && npm run dev (port 3000)');
  console.log('');
  
  const results = [];
  
  for (const test of seleniumTests) {
    try {
      await runTest(test.file);
      results.push({ name: test.name, file: test.file, status: 'PASS' });
    } catch (error) {
      results.push({ name: test.name, file: test.file, status: 'FAIL', error: error.message });
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  
  results.forEach(result => {
    const status = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Some tests failed. Check the output above for details.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
  }
}

async function runSpecificTest(testName) {
  const test = seleniumTests.find(t => 
    t.name.toLowerCase().includes(testName.toLowerCase()) ||
    t.file.toLowerCase().includes(testName.toLowerCase())
  );
  
  if (!test) {
    console.log('❌ Test not found. Available tests:');
    seleniumTests.forEach(t => console.log(`  - ${t.name} (${t.file})`));
    process.exit(1);
  }
  
  try {
    await runTest(test.file);
    console.log('\n🎉 Test completed successfully!');
  } catch (error) {
    console.log('\n❌ Test failed!');
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (!command || command === 'all') {
  runAllTests().catch(console.error);
} else if (command === 'list') {
  console.log('Available Selenium Tests:');
  seleniumTests.forEach((test, index) => {
    console.log(`${index + 1}. ${test.name} (${test.file})`);
  });
} else {
  runSpecificTest(command).catch(console.error);
} 