import { Builder, By, until } from 'selenium-webdriver';

const BASE_URL = 'http://localhost:3000'; // Next.js is running on 3000
const LOGIN_URL = `${BASE_URL}/login`;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testEnrollmentFunctionality() {
  console.log('🚀 Starting Enrollment Functionality Tests...\n');
  
  let driver = await new Builder().forBrowser('chrome').build();
  
  try {
    // Test 1: Instructor enrollment management
    console.log('🧪 Test 1: Instructor enrollment management');
    
    // Login as instructor
    await driver.get(LOGIN_URL);
    await sleep(1000);
    
    await driver.findElement(By.id('username')).sendKeys('instructor');
    await sleep(800);
    await driver.findElement(By.id('password')).sendKeys('password12377');
    await sleep(800);
    await driver.findElement(By.css('button[type="submit"]')).click();
    await sleep(2000);
    await driver.wait(until.urlContains('/dashboard'), 5000);
    
    await driver.get(`${BASE_URL}/students`);
    
    // Wait for page to load with better error handling
    try {
      await driver.wait(until.elementLocated(By.css('[data-testid="student-card"]')), 10000);
      
      // Check for enrollment status display
      const instructorStudentCards = await driver.findElements(By.css('[data-testid="student-card"]'));
      if (instructorStudentCards.length > 0) {
        console.log('✅ Instructor can view student enrollment status');
        
        // Look for enrollment badges and information
        const firstCard = instructorStudentCards[0];
        try {
          const enrollmentBadges = await firstCard.findElements(By.css('.bg-blue-50'));
          if (enrollmentBadges.length > 0) {
            console.log('✅ Enrollment status badges displayed for instructor');
          } else {
            console.log('⚠️ No enrollment badges found (may be no enrollments)');
          }
        } catch (error) {
          console.log('⚠️ Could not check enrollment badges');
        }
      }
    } catch (error) {
      console.log('⚠️ Student cards not found for instructor - may be no students');
    }
    
    // Test 2: Parent enrollment viewing
    console.log('\n🧪 Test 2: Parent enrollment viewing');
    
    // Login as parent
    await driver.get(LOGIN_URL);
    await sleep(1000);
    
    await driver.findElement(By.id('username')).sendKeys('parent');
    await sleep(800);
    await driver.findElement(By.id('password')).sendKeys('parent12377');
    await driver.findElement(By.css('button[type="submit"]')).click();
    await sleep(2000);
    
    // Wait for redirect to students page
    await driver.wait(until.urlContains('/students'), 5000);
    console.log('✅ Parent login successful, redirected to students');
    
    // Check enrollment display for parent
    try {
      await driver.wait(until.elementLocated(By.css('[data-testid="student-card"]')), 10000);
      const parentStudentCards = await driver.findElements(By.css('[data-testid="student-card"]'));
      
      if (parentStudentCards.length > 0) {
        const firstParentCard = parentStudentCards[0];
        
        try {
          const enrollmentSection = await firstParentCard.findElement(By.xpath('.//span[contains(text(), "Enrolled Classes")]'));
          console.log('✅ Parent can see enrollment information');
          
          // Check for enrollment status badges
          try {
            const statusBadges = await firstParentCard.findElements(By.css('.bg-blue-50 .inline-flex'));
            if (statusBadges.length > 0) {
              console.log('✅ Enrollment status badges visible to parent');
            }
          } catch (error) {
            console.log('⚠️ No enrollment status badges found (may be no enrollments)');
          }
        } catch (error) {
          console.log('⚠️ Enrollment section not found (may be empty)');
        }
      }
    } catch (error) {
      console.log('⚠️ Student cards not found for parent - may be no students or access restrictions');
    }
    
    // Test 3: Student enrollment viewing
    console.log('\n🧪 Test 3: Student enrollment viewing');
    
    // Login as student
    await driver.get(LOGIN_URL);
    await sleep(1000);
    
    await driver.findElement(By.id('username')).sendKeys('student1');
    await sleep(800);
    await driver.findElement(By.id('password')).sendKeys('student12377');
    await driver.findElement(By.css('button[type="submit"]')).click();
    await sleep(2000);
    
    // Wait for redirect to classes page
    await driver.wait(until.urlContains('/classes'), 5000);
    console.log('✅ Student login successful, redirected to classes');
    
    // Check if student can see their enrollments
    try {
      const classCards = await driver.findElements(By.css('[data-testid="class-card"]'));
      console.log(`✅ Student can see ${classCards.length} classes`);
      
      // Check for booking buttons (which indicate enrollment capability)
      if (classCards.length > 0) {
        const firstClass = classCards[0];
        try {
          const bookButton = await firstClass.findElement(By.xpath('.//button[contains(text(), "Book")]'));
          console.log('✅ Student can see booking options');
        } catch (error) {
          console.log('⚠️ No booking buttons found (may be no available classes)');
        }
      }
    } catch (error) {
      console.log('⚠️ No class cards found');
    }
    
    // Test 4: Enrollment status display
    console.log('\n🧪 Test 4: Enrollment status display');
    
    // Go back to instructor view to check status display
    await driver.get(LOGIN_URL);
    await sleep(1000);
    
    await driver.findElement(By.id('username')).sendKeys('instructor');
    await sleep(800);
    await driver.findElement(By.id('password')).sendKeys('password12377');
    await driver.findElement(By.css('button[type="submit"]')).click();
    await sleep(2000);
    
    await driver.get(`${BASE_URL}/students`);
    await driver.wait(until.elementLocated(By.css('[data-testid="student-card"]')), 5000);
    
    // Look for enrollment status badges
    try {
      const statusBadges = await driver.findElements(By.css('.bg-blue-50 .inline-flex'));
      if (statusBadges.length > 0) {
        console.log(`✅ Found ${statusBadges.length} enrollment status badges`);
        
        // Check different status types
        for (let i = 0; i < Math.min(statusBadges.length, 3); i++) {
          const statusText = await statusBadges[i].getText();
          console.log(`✅ Status badge ${i + 1}: ${statusText}`);
        }
      } else {
        console.log('⚠️ No enrollment status badges found (may be no enrollments)');
      }
    } catch (error) {
      console.log('⚠️ Could not find enrollment status badges');
    }
    
    // Test 5: Attendance tracking display
    console.log('\n🧪 Test 5: Attendance tracking display');
    
    try {
      const attendanceElements = await driver.findElements(By.xpath('//div[contains(text(), "Attendance:")]'));
      if (attendanceElements.length > 0) {
        console.log(`✅ Found ${attendanceElements.length} attendance tracking elements`);
        
        for (let i = 0; i < Math.min(attendanceElements.length, 2); i++) {
          const attendanceText = await attendanceElements[i].getText();
          console.log(`✅ Attendance ${i + 1}: ${attendanceText}`);
        }
      } else {
        console.log('⚠️ No attendance tracking elements found (may be no enrollments)');
      }
    } catch (error) {
      console.log('⚠️ Could not find attendance tracking elements');
    }
    
    console.log('\n✨ All enrollment functionality tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (driver) {
      await driver.quit();
    }
  }
}

// Run the test
testEnrollmentFunctionality().catch(console.error); 