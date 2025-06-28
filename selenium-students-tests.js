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
    
    // Wait for redirect and verify we're on dashboard (or students for parents)
    if (user.role === 'parent') {
      await driver.wait(until.urlContains('/students'), 5000);
      console.log(`✅ ${user.role} login successful, redirected to students`);
    } else {
      await driver.wait(until.urlContains('/dashboard'), 5000);
      console.log(`✅ ${user.role} login successful`);
    }
    
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
    
    // Test "Add New Student" button (instructor only)
    if (user.role === 'instructor') {
      console.log(`\n  📝 Testing Add New Student functionality...`);
      
      try {
        const addButton = await driver.findElement(By.css('[data-testid="add-student-button"]'));
        console.log(`✅ Add New Student button found`);
        
        // Click the button to open the dialog
        await addButton.click();
        await sleep(1000);
        
        // Check if dialog opened
        const dialog = await driver.findElement(By.css('[role="dialog"]'));
        console.log(`✅ Add New Student dialog opened`);
        
        // Test form fields
        const formFields = [
          { id: 'firstName', type: 'text' },
          { id: 'lastName', type: 'text' },
          { id: 'email', type: 'email' },
          { id: 'phone', type: 'tel' },
          { id: 'age', type: 'number' }
        ];
        
        for (const field of formFields) {
          try {
            const input = await driver.findElement(By.id(field.id));
            console.log(`✅ Form field "${field.id}" found`);
          } catch (error) {
            console.log(`⚠️ Form field "${field.id}" not found (may be optional)`);
          }
        }
        
        // Test dropdowns
        try {
          const beltLevelSelect = await driver.findElement(By.css('select, [role="combobox"]'));
          console.log(`✅ Belt level dropdown found`);
        } catch (error) {
          console.log(`⚠️ Belt level dropdown not found`);
        }
        
        // Close dialog
        const cancelButton = await driver.findElement(By.xpath('//button[text()="Cancel"]'));
        await cancelButton.click();
        await sleep(500);
        
        console.log(`✅ Add New Student dialog closed`);
        
      } catch (error) {
        console.log(`❌ Add New Student functionality test failed: ${error.message}`);
      }
    }
    
    // Wait for students to load (either cards or loading skeletons)
    await sleep(2000);
    
    // Check if students are displayed
    try {
      const studentCards = await driver.findElements(By.css('[data-testid="student-card"]'));
      console.log(`✅ Found ${studentCards.length} student cards`);
      
      if (studentCards.length > 0) {
        // Verify first student has enhanced elements
        const firstCard = studentCards[0];
        
        // Check student name/ID
        const studentName = await firstCard.findElement(By.css('[data-testid="student-name"]'));
        const nameText = await studentName.getText();
        console.log(`✅ Student name/ID displayed: ${nameText}`);
        
        // Check belt level with enhanced styling
        const beltLevel = await firstCard.findElement(By.css('[data-testid="belt-level"]'));
        const beltText = await beltLevel.getText();
        console.log(`✅ Belt level displayed: ${beltText}`);
        
        // Check for additional student information
        try {
          const parentInfo = await firstCard.findElement(By.xpath('.//span[contains(text(), "Parent")]'));
          console.log(`✅ Parent information displayed`);
        } catch (error) {
          console.log(`⚠️ Parent information not found in card`);
        }
        
        try {
          const dojoInfo = await firstCard.findElement(By.xpath('.//span[contains(text(), "Dojo")]'));
          console.log(`✅ Dojo information displayed`);
        } catch (error) {
          console.log(`⚠️ Dojo information not found in card`);
        }
        
        try {
          const memberSince = await firstCard.findElement(By.xpath('.//span[contains(text(), "Member Since")]'));
          console.log(`✅ Member since date displayed`);
        } catch (error) {
          console.log(`⚠️ Member since date not found in card`);
        }
        
        // Check View Full Profile button (updated text)
        const viewProfileButton = await firstCard.findElement(By.xpath('.//button[contains(text(), "View")]'));
        console.log(`✅ View Profile button found`);
        
        // Test clicking View Profile button
        await viewProfileButton.click();
        await sleep(2000);
        
        // Check if we navigated to student profile page
        const currentUrl = await driver.getCurrentUrl();
        if (currentUrl.includes('/students/')) {
          console.log(`✅ Successfully navigated to student profile page`);
          
          // Test enhanced student profile page
          console.log(`\n    📋 Testing enhanced student profile...`);
          
          try {
            // Check for comprehensive student information
            const profileTitle = await driver.findElement(By.css('h1'));
            const titleText = await profileTitle.getText();
            console.log(`    ✅ Profile title: ${titleText}`);
            
            // Check for statistics cards
            const statCards = await driver.findElements(By.css('.text-2xl.font-bold'));
            console.log(`    ✅ Found ${statCards.length} statistics cards`);
            
            // Check for parent information section
            try {
              const parentSection = await driver.findElement(By.xpath('//h4[contains(text(), "Parent Information")]'));
              console.log(`    ✅ Parent information section found`);
            } catch (error) {
              console.log(`    ⚠️ Parent information section not found`);
            }
            
            // Check for dojo information section
            try {
              const dojoSection = await driver.findElement(By.xpath('//h4[contains(text(), "Dojo Information")]'));
              console.log(`    ✅ Dojo information section found`);
            } catch (error) {
              console.log(`    ⚠️ Dojo information section not found`);
            }
            
            // Check for attendance history
            try {
              const attendanceSection = await driver.findElement(By.xpath('//h2[contains(text(), "Recent Attendance")]'));
              console.log(`    ✅ Attendance history section found`);
            } catch (error) {
              console.log(`    ⚠️ Attendance history section not found`);
            }
            
          } catch (error) {
            console.log(`    ❌ Error testing enhanced profile: ${error.message}`);
          }
          
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
  console.log('🚀 Starting Enhanced Selenium Students Page Tests...\n');
  
  // Test each user role that should have access
  for (const user of users) {
    await testStudentsPage(user);
  }
  
  console.log('\n✨ All enhanced students page tests completed!');
}

runAllTests().catch(console.error); 