import { Builder, By } from 'selenium-webdriver';

const BASE_URL = 'http://localhost:3000';
const LOGIN_URL = `${BASE_URL}/login`;

const users = [
  { 
    username: 'instructor', 
    password: 'password12377', 
    role: 'instructor'
  },
  { 
    username: 'parent', 
    password: 'parent12377', 
    role: 'parent'
  },
  { 
    username: 'student1', 
    password: 'student12377', 
    role: 'student'
  }
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testLogin(user) {
  let driver = await new Builder().forBrowser('chrome').build();
  
  try {
    console.log(`\n🧪 Testing ${user.role} login...`);
    
    // Login
    await driver.get(LOGIN_URL);
    await sleep(2000);
    
    console.log(`  📝 Filling login form...`);
    await driver.findElement(By.id('username')).sendKeys(user.username);
    await sleep(500);
    await driver.findElement(By.id('password')).sendKeys(user.password);
    await sleep(500);
    
    console.log(`  🔘 Clicking login button...`);
    await driver.findElement(By.css('button[type="submit"]')).click();
    
    console.log(`  ⏳ Waiting for redirect...`);
    await sleep(5000);
    
    // Check current URL
    const currentUrl = await driver.getCurrentUrl();
    console.log(`  📍 Current URL: ${currentUrl}`);
    
    // Check if there are any error messages
    try {
      const errorElement = await driver.findElement(By.css('.bg-red-50, .text-red-700'));
      const errorText = await errorElement.getText();
      console.log(`  ❌ Error message: ${errorText}`);
    } catch (error) {
      console.log(`  ✅ No error messages found`);
    }
    
    // Check if we're on the expected page
    if (user.role === 'instructor' && currentUrl.includes('/dashboard')) {
      console.log(`  ✅ Instructor correctly redirected to dashboard`);
    } else if ((user.role === 'parent' || user.role === 'student') && currentUrl.includes('/classes')) {
      console.log(`  ✅ ${user.role} correctly redirected to classes`);
    } else {
      console.log(`  ❌ Unexpected redirect for ${user.role}`);
    }
    
  } catch (error) {
    console.error(`❌ Test failed for ${user.role}:`, error.message);
  } finally {
    await driver.quit();
  }
}

async function runTests() {
  console.log('🚀 Starting Login Debug Tests...\n');
  
  for (const user of users) {
    await testLogin(user);
  }
  
  console.log('\n✨ All login debug tests completed!');
}

runTests().catch(console.error); 