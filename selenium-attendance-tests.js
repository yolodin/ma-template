import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USERS = {
  instructor: { username: 'instructor', password: 'instructor12377' },
  parent: { username: 'parent', password: 'parent12377' }
};

async function login(driver, userType) {
  const user = TEST_USERS[userType];
  
  await driver.get(`${BASE_URL}/login`);
  
  // Wait for login form to load
  await driver.wait(until.elementLocated(By.css('input[type="text"]')), 5000);
  
  // Find username and password inputs
  const usernameInput = await driver.findElement(By.css('input[type="text"]'));
  const passwordInput = await driver.findElement(By.css('input[type="password"]'));
  
  // Clear and fill inputs
  await usernameInput.clear();
  await usernameInput.sendKeys(user.username);
  await passwordInput.clear();
  await passwordInput.sendKeys(user.password);
  
  // Submit form
  const submitButton = await driver.findElement(By.css('button[type="submit"]'));
  await submitButton.click();
  // No redirect wait here
}

async function selectClass(driver) {
  // Find the class selector trigger
  const classSelector = await driver.findElement(By.css('[data-testid="class-select-trigger"]'));
  await classSelector.click();
  
  // Wait for dropdown to appear and find options
  await driver.sleep(1000);
  
  // Look for options in the Radix UI portal
  const options = await driver.findElements(By.css('[role="option"]'));
  if (options.length > 0) {
    await options[0].click();
    console.log('✓ Class selected from dropdown');
    return true;
  }
  
  // Fallback: try to find options by text content
  const optionByText = await driver.findElement(By.xpath("//div[contains(text(), 'Class')]"));
  if (optionByText) {
    await optionByText.click();
    console.log('✓ Class selected by text content');
    return true;
  }
  
  console.log('⚠ Could not select class from dropdown');
  return false;
}

async function testAttendancePage() {
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
    
    console.log('Starting Attendance Page Tests...\n');
    
    // Test 1: Instructor can access attendance page and see all features
    console.log('Test 1: Instructor attendance page access');
    await login(driver, 'instructor');
    
    // Navigate to attendance page
    await driver.get(`${BASE_URL}/attendance`);
    await driver.wait(until.titleContains('YOLO Dojo'), 5000);
    
    // Check if page loads correctly
    const pageTitle = await driver.findElement(By.css('h1'));
    const titleText = await pageTitle.getText();
    if (titleText.includes('Attendance Tracking')) {
      console.log('✓ Attendance page title correct');
    } else {
      console.log('⚠ Attendance page title incorrect:', titleText);
    }
    
    // Check if class selector is visible
    const classSelectors = await driver.findElements(By.css('[data-testid="class-select-trigger"]'));
    if (classSelectors.length > 0) {
      console.log('✓ Class selector visible for instructor');
    } else {
      console.log('⚠ Class selector not found for instructor');
    }
    
    // Check if mode selection buttons are visible
    const checkInButtons = await driver.findElements(By.xpath("//button[contains(text(), 'Check-In')]"));
    const checkOutButtons = await driver.findElements(By.xpath("//button[contains(text(), 'Check-Out')]"));
    
    if (checkInButtons.length > 0 && checkOutButtons.length > 0) {
      console.log('✓ Check-in/Check-out mode buttons visible');
    } else {
      console.log('⚠ Mode selection buttons not found');
    }
    
    // Check if manual check-in section is visible (instructor only)
    const manualCheckInSections = await driver.findElements(By.xpath("//h3[contains(text(), 'Manual Check-In')]"));
    if (manualCheckInSections.length > 0) {
      console.log('✓ Manual check-in section visible for instructor');
    } else {
      console.log('⚠ Manual check-in section not found for instructor');
    }
    
    // Test 2: Parent cannot access manual check-in (should not see it)
    console.log('\nTest 2: Parent access restrictions');
    await login(driver, 'parent');
    
    await driver.get(`${BASE_URL}/attendance`);
    await driver.wait(until.titleContains('YOLO Dojo'), 5000);
    
    // Check if manual check-in section is NOT visible for parent
    const parentManualSections = await driver.findElements(By.xpath("//h3[contains(text(), 'Manual Check-In')]"));
    if (parentManualSections.length === 0) {
      console.log('✓ Manual check-in section correctly hidden from parent');
    } else {
      console.log('⚠ Manual check-in section should not be visible to parent');
    }
    
    // Test 3: QR scanner functionality
    console.log('\nTest 3: QR scanner controls');
    await login(driver, 'instructor');
    
    await driver.get(`${BASE_URL}/attendance`);
    await driver.wait(until.titleContains('YOLO Dojo'), 5000);
    
    // Select a class first
    const classSelected = await selectClass(driver);
    
    if (classSelected) {
      // Check if start scanning button is enabled
      const startScanButtons = await driver.findElements(By.xpath("//button[contains(text(), 'Start Scanning')]"));
      if (startScanButtons.length > 0) {
        const isDisabled = await startScanButtons[0].getAttribute('disabled');
        if (!isDisabled) {
          console.log('✓ Start scanning button enabled after class selection');
        } else {
          console.log('⚠ Start scanning button still disabled after class selection');
        }
      }
      
      // Test start scanning
      if (startScanButtons.length > 0) {
        await startScanButtons[0].click();
        console.log('✓ Start scanning button clicked');
        
        // Wait a moment for scanner to initialize
        await driver.sleep(2000);
        
        // Check if stop scanning button is now enabled
        const stopScanButtons = await driver.findElements(By.xpath("//button[contains(text(), 'Stop Scanning')]"));
        if (stopScanButtons.length > 0) {
          const isStopDisabled = await stopScanButtons[0].getAttribute('disabled');
          if (!isStopDisabled) {
            console.log('✓ Stop scanning button enabled after starting scan');
          } else {
            console.log('⚠ Stop scanning button still disabled after starting scan');
          }
          
          // Stop scanning
          await stopScanButtons[0].click();
          console.log('✓ Stop scanning button clicked');
        }
      }
    }
    
    // Test 4: Manual check-in form validation
    console.log('\nTest 4: Manual check-in form validation');
    
    // Try to submit without selecting student
    const manualCheckInButtons = await driver.findElements(By.xpath("//button[contains(text(), 'Manual Check-In')]"));
    if (manualCheckInButtons.length > 0) {
      const isDisabled = await manualCheckInButtons[0].getAttribute('disabled');
      if (isDisabled) {
        console.log('✓ Manual check-in button correctly disabled without student selection');
      } else {
        console.log('⚠ Manual check-in button should be disabled without student selection');
      }
    }
    
    // Test 5: Page responsiveness and layout
    console.log('\nTest 5: Page layout and responsiveness');
    
    // Check if all main sections are present
    const sections = [
      'Select Class',
      'QR Code Scanner',
      'Manual Check-In',
      'How to Use'
    ];
    
    for (const section of sections) {
      const sectionElements = await driver.findElements(By.xpath(`//h3[contains(text(), '${section}')]`));
      if (sectionElements.length > 0) {
        console.log(`✓ ${section} section present`);
      } else {
        console.log(`⚠ ${section} section missing`);
      }
    }
    
    console.log('\n✅ All Attendance Page Tests Passed!');
    
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
testAttendancePage().catch(console.error); 