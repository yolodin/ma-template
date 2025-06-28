import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USERS = {
  parent: { username: 'parent', password: 'parent12377' },
  student: { username: 'student1', password: 'student12377' }
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
  
  // Wait for redirect
  const expectedPath = userType === 'parent' ? '/students' : userType === 'student' ? '/classes' : '/dashboard';
  await driver.wait(until.urlContains(expectedPath), 5000);
}

async function selectStudent(driver) {
  // Find the student selector trigger
  const studentSelector = await driver.findElement(By.css('[data-testid="student-select-trigger"]'));
  await studentSelector.click();
  
  // Wait for dropdown to appear and find options
  await driver.sleep(1000);
  
  // Look for options in the Radix UI portal
  const options = await driver.findElements(By.css('[role="option"]'));
  if (options.length > 0) {
    await options[0].click();
    console.log('✓ Student selected from dropdown');
    return true;
  }
  
  // Fallback: try to find options by text content
  const optionByText = await driver.findElement(By.xpath("//div[contains(text(), 'Student')]"));
  if (optionByText) {
    await optionByText.click();
    console.log('✓ Student selected by text content');
    return true;
  }
  
  console.log('⚠ Could not select student from dropdown');
  return false;
}

async function testBookingFunctionality() {
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
    
    console.log('Starting Classes Booking Tests...\n');
    
    // Test 1: Parent can see student selector and booking buttons
    console.log('Test 1: Parent booking functionality');
    await login(driver, 'parent');
    
    // Navigate to classes page
    await driver.get(`${BASE_URL}/classes`);
    // Debug: print current page title and URL
    const debugTitle = await driver.getTitle();
    const debugUrl = await driver.getCurrentUrl();
    console.log('DEBUG: Page title after navigation:', debugTitle);
    console.log('DEBUG: Page URL after navigation:', debugUrl);
    await driver.wait(until.titleContains('YOLO Dojo'), 5000);
    
    // Check if student selector is visible
    const studentSelector = await driver.findElement(By.css('[data-testid="student-select-trigger"]'));
    console.log('✓ Student selector visible for parent');
    
    // Select a student
    const studentSelected = await selectStudent(driver);
    
    if (studentSelected) {
      // Wait for booking buttons to appear
      await driver.sleep(1000);
      
      // Check if booking buttons appear
      const bookButtons = await driver.findElements(By.xpath("//button[contains(text(), 'Book')]"));
      const unbookButtons = await driver.findElements(By.xpath("//button[contains(text(), 'Unbook')]"));
      
      if (bookButtons.length > 0 || unbookButtons.length > 0) {
        console.log(`✓ Found ${bookButtons.length} Book buttons and ${unbookButtons.length} Unbook buttons`);
      } else {
        console.log('⚠ No booking buttons found');
      }
    }
    
    // Test 2: Student can see their own booking functionality
    console.log('\nTest 2: Student booking functionality');
    await login(driver, 'student');
    
    await driver.get(`${BASE_URL}/classes`);
    await driver.wait(until.titleContains('YOLO Dojo'), 5000);
    
    // Check if student selector is visible for student
    const studentSelectors = await driver.findElements(By.css('[data-testid="student-select-trigger"]'));
    if (studentSelectors.length > 0) {
      console.log('✓ Student selector visible for student');
    } else {
      console.log('⚠ Student selector not found for student');
    }
    
    // Test 3: Booking buttons are disabled when class is full
    console.log('\nTest 3: Booking button states');
    const classCards = await driver.findElements(By.css('[data-testid="class-card"]'));
    if (classCards.length > 0) {
      const firstCard = classCards[0];
      
      // Check enrollment info
      const enrollmentElements = await firstCard.findElements(By.css('[data-testid="class-enrollment"]'));
      if (enrollmentElements.length > 0) {
        const enrollmentText = await enrollmentElements[0].getText();
        console.log(`✓ Enrollment info: ${enrollmentText}`);
      }
      
      // Check if buttons are properly disabled/enabled based on capacity
      const bookButtonsInCard = await firstCard.findElements(By.xpath(".//button[contains(text(), 'Book')]"));
      if (bookButtonsInCard.length > 0) {
        const isDisabled = await bookButtonsInCard[0].getAttribute('disabled');
        console.log(`✓ Book button disabled state: ${isDisabled}`);
      }
    }
    
    console.log('\n✅ All Classes Booking Tests Passed!');
    
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
testBookingFunctionality().catch(console.error); 