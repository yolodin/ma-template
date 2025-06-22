import { Builder, By, until } from 'selenium-webdriver';

const BASE_URL = 'http://localhost:3000'; // Next.js is running on 3000
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
  }
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testStudentsPage(user) {
  let driver = await new Builder().forBrowser('chrome').build();
  
  try {
    console.log(`\n🧪 Testing ${user.role} students page access...`);
    
    // Login
    await driver.get(LOGIN_URL);
    await sleep(1000);
    
    await driver.findElement(By.id('username')).sendKeys(user.username);
    await sleep(800);
    await driver.findElement(By.id('password')).sendKeys(user.password);
    await sleep(800);
    await driver.findElement(By.css('button[type="submit"]')).click();
    await sleep(2000);
    
    // Wait for redirect and verify we're on dashboard
    await driver.wait(until.urlContains('/dashboard'), 5000);
    console.log(`✅ ${user.role} login successful`);
    
    // Navigate to students page
    const studentsLink = await driver.findElement(By.xpath('//a[contains(@href, "/students")]'));
    await studentsLink.click();
    await sleep(2000);
    
    // Wait for students page to load
    await driver.wait(until.urlContains('/students'), 5000);
    console.log(`✅ Successfully navigated to students page`);
    
    // Verify page title
    const pageTitle = await driver.findElement(By.css('h1'));
    const titleText = await pageTitle.getText();
    console.log(`✅ Page title: ${titleText}`);
    
    // Wait for students to load (either cards or loading skeletons)
    await sleep(2000);
    
    // Check if students are displayed
    try {
      const studentCards = await driver.findElements(By.css('[data-testid="student-card"]'));
      console.log(`✅ Found ${studentCards.length} student cards`);
      
      if (studentCards.length > 0) {
        // Verify first student has required elements
        const firstCard = studentCards[0];
        
        // Check student name (since students don't have names in the schema, this will show parent info)
        const studentName = await firstCard.findElement(By.css('[data-testid="student-name"]'));
        const nameText = await studentName.getText();
        console.log(`✅ Student name displayed: ${nameText}`);
        
        // Check belt level
        const beltLevel = await firstCard.findElement(By.css('[data-testid="belt-level"]'));
        const beltText = await beltLevel.getText();
        console.log(`✅ Belt level displayed: ${beltText}`);
        
        // Check View Profile button
        const viewProfileButton = await firstCard.findElement(By.xpath('.//button[text()="View Profile"]'));
        console.log(`✅ View Profile button found`);
        
        // Test clicking View Profile button
        await viewProfileButton.click();
        await sleep(2000);
        
        // Check if we navigated to student profile page
        const currentUrl = await driver.getCurrentUrl();
        if (currentUrl.includes('/students/')) {
          console.log(`✅ Successfully navigated to student profile page`);
        } else {
          console.log(`❌ Failed to navigate to student profile page. Current URL: ${currentUrl}`);
        }
        
        // Go back to students list
        await driver.navigate().back();
        await sleep(2000);
        
        // Verify we're back on students page
        const backUrl = await driver.getCurrentUrl();
        if (backUrl.includes('/students')) {
          console.log(`✅ Successfully returned to students page`);
        } else {
          console.log(`❌ Failed to return to students page. Current URL: ${backUrl}`);
        }
        
      } else {
        console.log(`⚠️ No student cards found - this might be expected for ${user.role}`);
      }
      
    } catch (error) {
      console.log(`❌ Error checking student cards: ${error.message}`);
      
      // Check if there's an error message or "no students" message
      try {
        const errorElement = await driver.findElement(By.css('.bg-red-100, .text-gray-500'));
        const errorText = await errorElement.getText();
        console.log(`ℹ️ Page shows: ${errorText}`);
      } catch (err) {
        console.log(`❌ No error message or student cards found`);
      }
    }
    
    // Test logout
    console.log(`\n  🚪 Testing logout...`);
    const logoutButton = await driver.findElement(By.xpath('//button[contains(text(), "Logout")]'));
    await logoutButton.click();
    await sleep(2000);
    
    // Verify redirect to login page
    const currentUrl = await driver.getCurrentUrl();
    if (currentUrl.includes('/login')) {
      console.log(`  ✅ Logout successful, redirected to login page`);
    } else {
      console.log(`  ❌ Logout failed, current URL: ${currentUrl}`);
    }
    
  } catch (error) {
    console.error(`❌ Test failed for ${user.role}:`, error.message);
  } finally {
    await driver.quit();
  }
}

async function runAllTests() {
  console.log('🚀 Starting Selenium Students Page Tests...\n');
  
  // Test each user role that should have access
  for (const user of users) {
    await testStudentsPage(user);
  }
  
  console.log('\n✨ All students page tests completed!');
}

runAllTests().catch(console.error); 