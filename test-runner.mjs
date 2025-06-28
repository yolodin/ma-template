console.log('Running Student Management System Test Suite\n');

// Test API Endpoints
console.log('Testing API Endpoints...');
try {
  // Test authentication
  const authResponse = await fetch('http://localhost:8000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'instructor',
      password: 'password12377'
    })
  });
  
  const authData = await authResponse.json();
  console.log(`   ✓ Authentication: ${authResponse.status === 200 ? 'PASS' : 'FAIL'}`);
  
  if (authResponse.status === 200 && authData.accessToken) {
    // Test student creation
    const studentResponse = await fetch('http://localhost:8000/api/students', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.accessToken}`
      },
      body: JSON.stringify({
        parentId: 2,
        dojoId: 1,
        beltLevel: 'green',
        age: 12
      })
    });
    console.log(`   ✓ Student creation API: ${studentResponse.status === 201 ? 'PASS' : 'FAIL'}`);
  }
} catch (error) {
  console.log(`   ✗ API test failed: ${error.message}`);
}

console.log('\nTest Suite Complete!');