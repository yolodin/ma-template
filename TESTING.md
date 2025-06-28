# Testing Guide

This document provides comprehensive testing instructions for the YOLO Dojo Management System.

## 🧪 Testing Overview

The project includes multiple testing layers:

1. **Python Tests** - FastAPI backend unit and integration tests
2. **Selenium Tests** - End-to-end UI testing
3. **Manual Testing** - User acceptance testing

## 🐍 Python Tests (FastAPI)

### Setup

1. **Install Python dependencies:**
   ```bash
   cd fastapi_server && pip3 install -r requirements.txt
   ```

2. **Run tests:**
   ```bash
   cd fastapi_server && python3 -m pytest
   ```

### Test Coverage

The Python tests cover:
- API endpoint functionality
- Authentication and authorization
- Database operations
- Data validation
- Error handling
- **Enhanced student functionality**:
  - Student creation with comprehensive data
  - Student profile retrieval
  - Parent-child relationship validation
  - Student attendance tracking
  - Role-based student access control

## 🌐 Selenium Tests

### Prerequisites

1. **Install Selenium dependencies:**
   ```bash
   npm install selenium-webdriver chromedriver
   ```

2. **Ensure Chrome browser is installed** on your system

3. **Start both servers:**
   ```bash
   # Terminal 1: Start FastAPI server
   cd fastapi_server && python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   
   # Terminal 2: Start Next.js client
   cd client && npm run dev
   ```

### Running Selenium Tests

```bash
# Run all tests
node test-runner.mjs

# Run specific test files
node selenium-layout-tests.js
node selenium-classes-tests.js
node selenium-students-tests.js
node selenium-attendance-tests.js
```

### Test Coverage

The Selenium tests verify:

#### 1. Role-Based Navigation
- **Instructor**: Full access to all menu items
  - Dashboard, Students, Classes, Messages, Attendance
- **Parent**: Limited access
  - Students, Classes, Messages
- **Student**: Basic access
  - Classes, Messages

#### 2. User Interface Validation
- Sidebar displays correct user information
- User role is properly displayed
- Active page highlighting works
- Menu items are correctly shown/hidden based on role

#### 3. Navigation Testing
- All accessible pages load correctly
- URL changes match expected routes
- Page content is displayed
- Navigation between pages works smoothly

#### 4. Enhanced Student Management
- **Student Cards**: Comprehensive student information display
  - Parent and dojo relationship details
  - Belt level with color-coded badges
  - Member since dates and status indicators
- **Add New Student**: Advanced form functionality
  - Form dialog opens and closes correctly
  - All form fields are present and functional
  - Parent and dojo selection dropdowns work
  - Form validation and submission
- **Student Profiles**: Detailed individual student pages
  - Comprehensive student information sections
  - Statistics cards and attendance data
  - Parent and dojo information display
  - Navigation between list and profile views

#### 5. Authentication Flows
- Login works for all user types
- Proper redirects after login
- Logout functionality works
- Session management is correct

#### 6. Mobile Responsiveness
- Mobile menu button is visible on small screens
- Mobile sidebar opens correctly
- Navigation works on mobile devices
- Responsive layout adapts properly

#### 7. Security Verification
- Restricted menu items are properly hidden
- Users cannot access unauthorized pages
- Role-based access control is enforced

### Test Output Example

```
🚀 Starting Selenium Layout Tests...

🧪 Testing instructor navigation...
✅ instructor login successful
✅ Sidebar is visible for instructor
✅ User info displayed: Master Kim
✅ Role displayed: Instructor
✅ Menu item "Dashboard" is visible for instructor
✅ Menu item "Students" is visible for instructor
✅ Menu item "Classes" is visible for instructor
✅ Menu item "Messages" is visible for instructor
✅ Menu item "Attendance" is visible for instructor

🧭 Testing navigation to Students...
✅ Successfully navigated to Students
✅ Page title: Students

🚪 Testing logout...
✅ Logout successful, redirected to login page

📱 Testing mobile responsiveness...
✅ Mobile menu button is visible
✅ Mobile sidebar opens correctly
✅ Mobile navigation works correctly

✨ All tests completed!
```

### Test Configuration

The Selenium tests use the following configuration:

- **Browser**: Chrome (latest version)
- **Viewport**: Desktop (default) and mobile (375x667)
- **Base URL**: `http://localhost:3000` (Next.js client)
- **Test Users**: Pre-configured test accounts with different roles
- **Wait Times**: Optimized for visual feedback and reliability

### Test Users

The tests use these pre-configured accounts:

| Role | Username | Password | Access Level |
|------|----------|----------|--------------|
| Instructor | `instructor` | `password12377` | Full access |
| Parent | `parent` | `parent12377` | Limited access |
| Student | `student1` | `student12377` | Basic access |

### Troubleshooting

#### Common Issues

1. **"Chrome not found"**
   - Ensure Chrome browser is installed
   - Update Chrome to latest version

2. **"Element not found"**
   - Verify both servers are running
   - Check that the client is accessible at `http://localhost:3000`
   - Ensure test users exist in the database

3. **"Port already in use"**
   - Kill existing processes: `pkill -f "uvicorn"` or `pkill -f "next"`
   - Restart servers on different ports if needed

4. **"Mobile test fails"**
   - This is usually a timing issue
   - The test will still verify mobile sidebar functionality
   - Check browser console for any JavaScript errors

#### Debug Mode

To run tests with slower execution for debugging:

```javascript
// In selenium-layout-tests.js, increase sleep times:
await sleep(3000); // Increase from 1000 to 3000
```

#### Headless Mode

To run tests without opening browser windows:

```javascript
// Add to the Builder configuration:
const driver = await new Builder()
  .forBrowser('chrome')
  .setChromeOptions(new chrome.Options().headless())
  .build();
```

### Integration with CI/CD

The Selenium tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Selenium Tests
  run: |
    npm install selenium-webdriver chromedriver
    node test-runner.mjs
```

---

## 🚀 Quick Start Testing

### 1. Start Servers

```bash
# Terminal 1: FastAPI server
cd fastapi_server && python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd client && npm run dev
```

### 2. Run Tests

```bash
# Python tests
cd fastapi_server && python3 -m pytest

# Selenium tests
node test-runner.mjs
```

### 3. Manual Testing

1. Open `http://localhost:3000` in your browser
2. Login with test accounts:
   - Instructor: `instructor` / `password12377`
   - Parent: `parent` / `parent12377`
   - Student: `student1` / `student12377`
3. Test different features based on user role

---

## 📊 Test Results

The testing suite provides comprehensive coverage of:
- ✅ Authentication and authorization
- ✅ Role-based access control
- ✅ User interface functionality
- ✅ Navigation and routing
- ✅ Mobile responsiveness
- ✅ API endpoint functionality
- ✅ Database operations
- ✅ Error handling

All tests should pass before deploying to production.