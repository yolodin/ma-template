import { Builder, By, until } from 'selenium-webdriver';

// Test configuration
const BASE_URL = 'http://localhost:3000';
const LOGIN_URL = `${BASE_URL}/login`;
const QOL_URL = `${BASE_URL}/test-qol`;

const users = [
  { 
    username: 'instructor', 
    password: 'password77', 
    role: 'instructor'
  }
];

// Helper function to wait for element
async function waitForElement(driver, selector, timeout = 5000) {
  return await driver.wait(until.elementLocated(By.css(selector)), timeout);
}

// Helper function to wait for element to be visible
async function waitForVisible(driver, selector, timeout = 5000) {
  const element = await waitForElement(driver, selector, timeout);
  return await driver.wait(until.elementIsVisible(element), timeout);
}

// Helper function to wait for element to disappear
async function waitForNotVisible(driver, selector, timeout = 5000) {
  try {
    const element = await driver.findElement(By.css(selector));
    await driver.wait(until.stalenessOf(element), timeout);
    return true;
  } catch (error) {
    return false;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loginAndGoToQol(driver, user) {
  await driver.get(LOGIN_URL);
  await sleep(1000);
  await driver.findElement(By.id('username')).sendKeys(user.username);
  await sleep(300);
  await driver.findElement(By.id('password')).sendKeys(user.password);
  await sleep(300);
  await driver.findElement(By.css('button[type="submit"]')).click();
  await sleep(1500);
  await driver.get(QOL_URL);
  await sleep(1000);
}

async function testToasts(user) {
  let driver = await new Builder().forBrowser('chrome').build();
  try {
    console.log(`\n🧪 Testing toast notifications for ${user.role}...`);
    await loginAndGoToQol(driver, user);
    // Success toast
    await driver.findElement(By.css('[data-testid="toast-success-btn"]')).click();
    await sleep(500);
    try {
      // Look for toast content in the page
      const toastElements = await driver.findElements(By.xpath("//*[contains(text(), 'Success!') or contains(text(), 'This is a success toast')]"));
      if (toastElements.length > 0) {
        console.log('✅ Success toast appeared');
      } else {
        console.log('❌ Success toast did not appear');
      }
    } catch {
      console.log('❌ Success toast did not appear');
    }
    await sleep(2000); // Wait for toast to disappear
    // Error toast
    await driver.findElement(By.css('[data-testid="toast-error-btn"]')).click();
    await sleep(500);
    try {
      // Look for toast content in the page
      const toastElements = await driver.findElements(By.xpath("//*[contains(text(), 'Error!') or contains(text(), 'This is an error toast')]"));
      if (toastElements.length > 0) {
        console.log('✅ Error toast appeared');
      } else {
        console.log('❌ Error toast did not appear');
      }
    } catch {
      console.log('❌ Error toast did not appear');
    }
    await sleep(2000);
  } catch (error) {
    console.error(`❌ Toast test failed for ${user.role}:`, error.message);
  } finally {
    await driver.quit();
  }
}

async function testLoadingSpinner(user) {
  let driver = await new Builder().forBrowser('chrome').build();
  try {
    console.log(`\n🧪 Testing loading spinner for ${user.role}...`);
    await loginAndGoToQol(driver, user);
    await driver.findElement(By.css('[data-testid="loading-btn"]')).click();
    await sleep(300);
    try {
      const spinner = await driver.findElement(By.css('.animate-spin'));
      if (spinner) {
        console.log('✅ Loading spinner appeared');
      }
    } catch {
      console.log('❌ Loading spinner did not appear');
    }
    await sleep(2200); // Wait for spinner to disappear
    // Confirm spinner is gone
    const spinners = await driver.findElements(By.css('.animate-spin'));
    if (spinners.length === 0) {
      console.log('✅ Loading spinner disappeared');
    } else {
      console.log('❌ Loading spinner did not disappear');
    }
  } catch (error) {
    console.error(`❌ Loading spinner test failed for ${user.role}:`, error.message);
  } finally {
    await driver.quit();
  }
}

async function test404Page(user) {
  let driver = await new Builder().forBrowser('chrome').build();
  try {
    console.log(`\n🧪 Testing 404 page for ${user.role}...`);
    await loginAndGoToQol(driver, user);
    await driver.findElement(By.css('[data-testid="404-link"]')).click();
    await sleep(1000);
    const notFound = await driver.findElement(By.css('h1'));
    const text = await notFound.getText();
    if (text.toLowerCase().includes('404') || text.toLowerCase().includes('not found')) {
      console.log('✅ 404 page displayed');
    } else {
      console.log(`❌ Unexpected 404 page content: ${text}`);
    }
  } catch (error) {
    console.error(`❌ 404 page test failed for ${user.role}:`, error.message);
  } finally {
    await driver.quit();
  }
}

async function runAllTests() {
  console.log('🚀 Starting Selenium QoL Enhancement Tests...\n');
  for (const user of users) {
    await testToasts(user);
    await testLoadingSpinner(user);
    await test404Page(user);
  }
  console.log('\n✨ All QoL enhancement tests completed!');
}

runAllTests().catch(console.error); 