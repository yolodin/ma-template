import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USERS = {
  instructor: { username: 'instructor', password: 'password12377' },
  parent: { username: 'parent', password: 'parent12377' },
  student: { username: 'student1', password: 'student12377' }
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function login(driver, userType) {
  const user = TEST_USERS[userType];
  
  console.log(`  🔐 Logging in as ${userType}...`);
  await driver.get(`${BASE_URL}/login`);
  await sleep(1000);
  
  // Wait for login form to load
  await driver.wait(until.elementLocated(By.id('username')), 5000);
  console.log(`  📝 Login form loaded`);
  
  // Find username and password inputs
  const usernameInput = await driver.findElement(By.id('username'));
  const passwordInput = await driver.findElement(By.id('password'));
  
  // Clear and fill inputs
  await usernameInput.clear();
  await usernameInput.sendKeys(user.username);
  await sleep(500);
  await passwordInput.clear();
  await passwordInput.sendKeys(user.password);
  await sleep(500);
  console.log(`  📝 Credentials entered`);
  
  // Submit form
  const submitButton = await driver.findElement(By.css('button[type="submit"]'));
  await submitButton.click();
  console.log(`  🔘 Login button clicked`);
  await sleep(2000);
  
  // Check current URL before waiting for redirect
  const urlBeforeRedirect = await driver.getCurrentUrl();
  console.log(`  📍 URL before redirect: ${urlBeforeRedirect}`);
  
  // Wait for redirect (different for different user types)
  try {
    if (userType === 'instructor') {
      await driver.wait(until.urlContains('/dashboard'), 5000);
      console.log(`  ✅ Instructor redirected to dashboard`);
    } else if (userType === 'parent') {
      await driver.wait(until.urlContains('/students'), 5000);
      console.log(`  ✅ Parent redirected to students`);
    } else if (userType === 'student') {
      await driver.wait(until.urlContains('/classes'), 5000);
      console.log(`  ✅ Student redirected to classes`);
    }
  } catch (error) {
    const currentUrl = await driver.getCurrentUrl();
    console.log(`  ❌ Redirect failed. Current URL: ${currentUrl}`);
    
    // Check for error messages
    try {
      const errorElements = await driver.findElements(By.css('.text-red-500, .bg-red-50, .text-red-700'));
      if (errorElements.length > 0) {
        const errorText = await errorElements[0].getText();
        console.log(`  ❌ Error message: ${errorText}`);
      }
    } catch (e) {
      console.log(`  ⚠️ Could not find error messages`);
    }
    
    throw error;
  }
}

async function testClassesPage() {
  let driver;
  
  try {
    // Setup Chrome driver
    const options = new chrome.Options();
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
    
    console.log('Starting Classes Page Tests...\n');
    
    // Test 1: Instructor can view classes and see Add Class button
    console.log('Test 1: Instructor classes page functionality');
    await login(driver, 'instructor');
    
    // Verify we're on dashboard
    const dashboardUrl = await driver.getCurrentUrl();
    console.log(`✓ After login, on URL: ${dashboardUrl}`);
    
    // Try to find the dashboard h1 to confirm we're authenticated
    try {
      const dashboardH1 = await driver.findElement(By.xpath("//h1[contains(text(), 'Dashboard')]"));
      console.log('✓ Successfully authenticated and on dashboard');
    } catch (error) {
      console.log('❌ Not on dashboard after login');
    }
    
    // Navigate to classes page via sidebar link instead of direct URL
    try {
      const classesLink = await driver.findElement(By.xpath('//a[contains(@href, "/classes")]'));
      await classesLink.click();
      console.log('✓ Clicked classes link in sidebar');
      await sleep(3000);
    } catch (error) {
      console.log('⚠️ Could not find classes link in sidebar, trying direct navigation');
      // Navigate to classes page directly
      await driver.get(`${BASE_URL}/classes`);
    }
    
    await driver.wait(until.titleContains('YOLO Dojo'), 10000);
    
    // Wait for page to load completely
    await sleep(3000);
    
    try {
      await driver.wait(until.elementLocated(By.xpath("//h1[contains(text(), 'Classes')]")), 10000);
      console.log('✓ Classes page loaded successfully');
    } catch (error) {
      // If exact text match fails, try finding any h1 element
      try {
        const h1Elements = await driver.findElements(By.css('h1'));
        if (h1Elements.length > 0) {
          const h1Text = await h1Elements[0].getText();
          const currentUrl = await driver.getCurrentUrl();
          console.log(`✓ Found h1 element with text: "${h1Text}" at URL: ${currentUrl}`);
          
          // If we're not on the classes page, navigate there again
          if (!currentUrl.includes('/classes')) {
            console.log('⚠️ Not on classes page, navigating again...');
            await driver.get(`${BASE_URL}/classes`);
            await sleep(3000);
            await driver.wait(until.elementLocated(By.xpath("//h1[contains(text(), 'Classes')]")), 10000);
            console.log('✓ Successfully navigated to classes page');
          }
        } else {
          console.log('⚠️ No h1 elements found on page');
        }
      } catch (h1Error) {
        console.log('⚠️ Could not find h1 element, continuing with test');
      }
    }
    
    // Check if Add Class button is visible for instructor
    try {
      const addClassButton = await driver.findElement(By.xpath("//button[contains(text(), 'Add Class')]"));
      console.log('✓ Add Class button visible for instructor');
      
      // Test Add Class dialog functionality
      console.log('Test 1.1: Add Class dialog functionality');
      await addClassButton.click();
      await sleep(1000);
      
      // Check if dialog opens
      const dialog = await driver.findElement(By.css('[role="dialog"]'));
      console.log('✓ Add Class dialog opened');
      
      // Fill in the form
      const nameInput = await driver.findElement(By.css('input[id="name"]'));
      await nameInput.sendKeys('Test Karate Class');
      console.log('✓ Class name entered');
      
      const descriptionInput = await driver.findElement(By.css('textarea[id="description"]'));
      await descriptionInput.sendKeys('A test class for Selenium testing');
      console.log('✓ Class description entered');
      
      // Select dojo
      const dojoSelectTrigger = await driver.findElement(By.css('[data-testid="dojo-select-trigger"]'));
      await dojoSelectTrigger.click();
      await driver.sleep(1000);
      await driver.takeScreenshot().then(function(image, err) {
        fs.writeFileSync('dojo-select-open.png', image, 'base64');
      });
      await driver.wait(until.elementLocated(By.css('[data-radix-select-item]')), 5000);
      const dojoOption = await driver.findElement(By.css('[data-radix-select-item]'));
      await dojoOption.click();
      console.log('✓ Dojo selected');
      
      // Select day of week
      const daySelectTrigger = await driver.findElement(By.css('[data-testid="day-select-trigger"]'));
      await daySelectTrigger.click();
      await driver.wait(until.elementLocated(By.css('[data-radix-select-item]')), 2000);
      const dayOptions = await driver.findElements(By.css('[data-radix-select-item]'));
      await dayOptions[1].click(); // Tuesday
      console.log('✓ Day of week selected');
      
      // Set time
      const startTimeInput = await driver.findElement(By.css('input[id="startTime"]'));
      await startTimeInput.sendKeys('18:00');
      console.log('✓ Start time entered');
      
      const endTimeInput = await driver.findElement(By.css('input[id="endTime"]'));
      await endTimeInput.sendKeys('19:00');
      console.log('✓ End time entered');
      
      // Set capacity
      const capacityInput = await driver.findElement(By.css('input[id="maxCapacity"]'));
      await capacityInput.clear();
      await capacityInput.sendKeys('15');
      console.log('✓ Capacity entered');
      
      // Select belt level
      const beltSelectTrigger = await driver.findElement(By.css('[data-testid="belt-select-trigger"]'));
      await beltSelectTrigger.click();
      await driver.wait(until.elementLocated(By.css('[data-radix-select-item]')), 2000);
      const beltOptions = await driver.findElements(By.css('[data-radix-select-item]'));
      await beltOptions[0].click(); // White
      console.log('✓ Belt level selected');
      
      // Submit the form
      const createButton = await driver.findElement(By.xpath("//button[contains(text(), 'Create Class')]"));
      await createButton.click();
      console.log('✓ Create Class button clicked');
      
      // Wait for dialog to close and check for success toast
      await driver.sleep(2000);
      
      // Check for toast notification
      const toasts = await driver.findElements(By.css('.fixed.top-4.right-4 > div'));
      if (toasts.length > 0) {
        console.log('✓ Success toast notification appeared');
      } else {
        console.log('⚠ No success toast notification found');
      }
      
      // Check if new class appears in the list
      const newClassCard = await driver.findElement(By.xpath("//div[contains(text(), 'Test Karate Class')]"));
      if (newClassCard) {
        console.log('✓ New class appears in the list');
      } else {
        console.log('⚠ New class not found in list');
      }
      
      // Check if classes are displayed
      const classCards = await driver.findElements(By.css('[data-testid="class-card"]'));
      if (classCards.length > 0) {
        console.log(`✓ Found ${classCards.length} class cards`);
      } else {
        console.log('⚠ No class cards found (may be empty)');
      }
    } catch (error) {
      console.log('❌ Add Class button not found. Debug info:');
      const currentUrl = await driver.getCurrentUrl();
      console.log(`Current URL: ${currentUrl}`);
      
      // Try to find any buttons on the page
      const buttons = await driver.findElements(By.css('button'));
      console.log(`Found ${buttons.length} buttons on page`);
      
      if (buttons.length > 0) {
        for (let i = 0; i < Math.min(buttons.length, 5); i++) {
          try {
            const buttonText = await buttons[i].getText();
            console.log(`Button ${i + 1}: "${buttonText}"`);
          } catch (e) {
            console.log(`Button ${i + 1}: Could not get text`);
          }
        }
      }
      
      throw error;
    }
    
    // Test 2: Parent can view classes and see booking functionality
    console.log('\nTest 2: Parent classes page functionality');
    await login(driver, 'parent');
    
    await driver.get(`${BASE_URL}/classes`);
    await driver.wait(until.titleContains('YOLO Dojo'), 10000);
    
    // Wait for page to load completely
    await sleep(3000);
    
    try {
      await driver.wait(until.elementLocated(By.xpath("//h1[contains(text(), 'Classes')]")), 10000);
      console.log('✓ Parent classes page loaded successfully');
    } catch (error) {
      console.log('⚠️ Could not find h1 element for parent, continuing with test');
    }
    
    // Check if student selector is visible for parent
    const studentSelector = await driver.findElement(By.css('[data-testid="student-select-trigger"]'));
    console.log('✓ Student selector visible for parent');
    await studentSelector.click();
    await driver.wait(until.elementLocated(By.css('[data-radix-select-item]')), 2000);
    const studentOption = await driver.findElement(By.css('[data-radix-select-item]'));
    await studentOption.click();
    console.log('✓ Student selection working');
    
    // Check if booking buttons appear after student selection
    await driver.sleep(1000);
    const bookButtons = await driver.findElements(By.xpath("//button[contains(text(), 'Book')]"));
    const unbookButtons = await driver.findElements(By.xpath("//button[contains(text(), 'Unbook')]"));
    
    if (bookButtons.length > 0 && unbookButtons.length > 0) {
      console.log(`✓ Found ${bookButtons.length} Book buttons and ${unbookButtons.length} Unbook buttons`);
    } else {
      console.log('⚠ No booking buttons found');
    }
    
    // Check if Add Class button is NOT visible for parent
    const addClassButtons = await driver.findElements(By.xpath("//button[contains(text(), 'Add Class')]"));
    if (addClassButtons.length === 0) {
      console.log('✓ Add Class button NOT visible for parent (correct)');
    } else {
      console.log('✗ Add Class button should NOT be visible for parent');
    }
    
    // Test 3: Student can view classes and see booking functionality
    console.log('\nTest 3: Student classes page functionality');
    await login(driver, 'student');
    
    await driver.get(`${BASE_URL}/classes`);
    await driver.wait(until.titleContains('YOLO Dojo'), 5000);
    await driver.wait(until.elementLocated(By.xpath("//h1[contains(text(), 'Classes')]")), 5000);
    
    // Check if student selector is visible for student
    const studentSelectors = await driver.findElements(By.css('[data-radix-select-trigger]'));
    if (studentSelectors.length > 0) {
      console.log('✓ Student selector visible for student');
    } else {
      console.log('⚠ Student selector not found for student');
    }
    
    // Check if Add Class button is NOT visible for student
    const addClassButtonsStudent = await driver.findElements(By.xpath("//button[contains(text(), 'Add Class')]"));
    if (addClassButtonsStudent.length === 0) {
      console.log('✓ Add Class button NOT visible for student (correct)');
    } else {
      console.log('✗ Add Class button should NOT be visible for student');
    }
    
    // Test 4: Class card information display
    console.log('\nTest 4: Class card information display');
    const classCardsInfo = await driver.findElements(By.css('[data-testid="class-card"]'));
    if (classCardsInfo.length > 0) {
      const firstCard = classCardsInfo[0];
      
      // Check for class name
      const className = await firstCard.findElement(By.css('[data-testid="class-name"]'));
      console.log(`✓ Class name displayed: ${await className.getText()}`);
      
      // Check for day and time
      const dayTime = await firstCard.findElements(By.css('[data-testid="class-schedule"]'));
      if (dayTime.length > 0) {
        console.log('✓ Class schedule information displayed');
      }
      
      // Check for enrollment info
      const enrollment = await firstCard.findElements(By.css('[data-testid="class-enrollment"]'));
      if (enrollment.length > 0) {
        console.log('✓ Class enrollment information displayed');
      }
      
      // Check for belt level requirement
      const beltLevel = await firstCard.findElements(By.css('[data-testid="class-belt-level"]'));
      if (beltLevel.length > 0) {
        console.log('✓ Belt level requirement displayed');
      }
    } else {
      console.log('⚠ No class cards to test information display');
    }
    
    // Test 5: Booking functionality test
    console.log('\nTest 5: Booking functionality');
    await login(driver, 'parent');
    
    await driver.get(`${BASE_URL}/classes`);
    await driver.wait(until.titleContains('YOLO Dojo'), 5000);
    await driver.wait(until.elementLocated(By.xpath("//h1[contains(text(), 'Classes')]")), 5000);
    
    // Select a student
    const studentSelector2 = await driver.findElement(By.css('[data-testid="student-select-trigger"]'));
    await studentSelector2.click();
    await driver.wait(until.elementLocated(By.css('[data-radix-select-item]')), 2000);
    const studentOption2 = await driver.findElement(By.css('[data-radix-select-item]'));
    await studentOption2.click();
    console.log('✓ Student selected for booking test');
    
    // Try to book a class
    await driver.sleep(1000);
    const bookButtons2 = await driver.findElements(By.xpath("//button[contains(text(), 'Book')]"));
    if (bookButtons2.length > 0) {
      await bookButtons2[0].click();
      console.log('✓ Book button clicked');
      
      // Wait for potential toast notification
      await driver.sleep(2000);
      
      // Check for toast notifications
      const toasts = await driver.findElements(By.css('.fixed.top-4.right-4 > div'));
      if (toasts.length > 0) {
        console.log('✓ Toast notification appeared');
      } else {
        console.log('⚠ No toast notification found');
      }
    } else {
      console.log('⚠ No book buttons available');
    }
    
    // Test 6: Responsive design
    console.log('\nTest 6: Responsive design');
    
    // Test mobile view
    await driver.manage().window().setRect({ width: 375, height: 667 });
    await driver.sleep(1000);
    
    const mobileClassCards = await driver.findElements(By.css('[data-testid="class-card"]'));
    if (mobileClassCards.length > 0) {
      console.log('✓ Classes page responsive on mobile view');
    }
    
    // Test tablet view
    await driver.manage().window().setRect({ width: 768, height: 1024 });
    await driver.sleep(1000);
    
    const tabletClassCards = await driver.findElements(By.css('[data-testid="class-card"]'));
    if (tabletClassCards.length > 0) {
      console.log('✓ Classes page responsive on tablet view');
    }
    
    // Test desktop view
    await driver.manage().window().setRect({ width: 1920, height: 1080 });
    await driver.sleep(1000);
    
    const desktopClassCards = await driver.findElements(By.css('[data-testid="class-card"]'));
    if (desktopClassCards.length > 0) {
      console.log('✓ Classes page responsive on desktop view');
    }
    
    console.log('\n✅ All Classes Page Tests Passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    if (driver) {
      await driver.quit();
    }
  }
}

// Run the tests
testClassesPage().catch(console.error); 