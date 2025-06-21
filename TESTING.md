# Testing Documentation

This document provides comprehensive information about running tests in the YOLO Dojo Management System.

---

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Run all tests:**
   ```bash
   npm test
   ```
3. **Run a specific suite:**
   ```bash
   npm run test:api      # API tests
   npm run test:storage  # Storage tests
   npm run test:schema   # Schema tests
   ```
4. **Run with coverage:**
   ```bash
   npm run test:coverage
   ```
5. **Run automated UI tests:**
   ```bash
   node selenium-layout-tests.js
   ```

---

## Available Test Scripts

You can use the following npm scripts for convenience:

- `npm test` — Run all tests
- `npm run test:api` — Run only API tests
- `npm run test:storage` — Run only storage tests
- `npm run test:schema` — Run only schema tests
- `npm run test:coverage` — Run all tests with coverage
- `npm run test:watch` — Run tests in watch mode
- `npm run test:verbose` — Run tests with verbose output

---

## Test Structure

The project contains these main test suites:

- **Schema Tests** (`tests/schema.test.ts`) — Validates data schemas and validation rules
- **Storage Tests** (`tests/storage.test.ts`) — Tests the in-memory storage system
- **API Tests** (`tests/api.test.ts`) — Integration tests for API endpoints
- **Selenium Tests** (`selenium-layout-tests.js`) — Automated UI testing for layout and navigation
- **Test Runner** (`test-runner.mjs`) — Manual API endpoint testing (run with `node test-runner.mjs`)

---

## Automated UI Testing with Selenium

### Overview

The project includes comprehensive automated UI tests using Selenium WebDriver to verify:
- Role-based navigation functionality
- Sidebar layout and responsiveness
- User authentication flows
- Mobile responsiveness
- Menu item visibility based on user permissions

### Prerequisites

1. **Install Selenium dependencies:**
   ```bash
   npm install selenium-webdriver chromedriver
   ```

2. **Ensure Chrome browser is installed** on your system

3. **Start both servers:**
   ```bash
   # Terminal 1: Start Express server
   npm run dev
   
   # Terminal 2: Start Next.js client
   cd client && npm run dev
   ```

### Running Selenium Tests

```bash
node selenium-layout-tests.js
```

### Test Coverage

The Selenium tests verify:

#### 1. Role-Based Navigation
- **Instructor**: Full access to all menu items
  - Dashboard, Students, Classes, Messages, Attendance
- **Parent**: Limited access
  - Dashboard, Students, Classes, Messages
- **Student**: Basic access
  - Dashboard, Classes, Messages

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

#### 4. Authentication Flows
- Login works for all user types
- Proper redirects after login
- Logout functionality works
- Session management is correct

#### 5. Mobile Responsiveness
- Mobile menu button is visible on small screens
- Mobile sidebar opens correctly
- Navigation works on mobile devices
- Responsive layout adapts properly

#### 6. Security Verification
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
✅ Restricted menu item "Attendance" correctly hidden for parent

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
- **Base URL**: `http://localhost:3001` (Next.js client)
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
   - Check that the client is accessible at `http://localhost:3001`
   - Ensure test users exist in the database

3. **"Port already in use"**
   - Kill existing processes: `pkill -f "node"`
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
    node selenium-layout-tests.js
```

---

## ESM/TypeScript Compatibility

- Always use namespace imports for `supertest`, `express`, and `express-session` in test files:
  ```typescript
  import * as request from 'supertest';
  import * as express from 'express';
  import * as session from 'express-session';
  ```
- When using `supertest`, use `request(app)` (not `request.default(app)`).
- All async storage methods must be awaited.

---

## Prerequisites

Ensure you have all dependencies installed:

```bash
npm install
```

## Running Tests

### 1. Run All Tests

```bash
npm test
```

### 2. Run Specific Test Suites

```bash
npm run test:schema
npm run test:storage
npm run test:api
```

### 3. Run Tests with Coverage

```bash
npm run test:coverage
```

### 4. Run Tests in Watch Mode

```bash
npm run test:watch
```

### 5. Run Tests Verbosely

```bash
npm run test:verbose
```

### 6. Manual API Testing

```bash
npm run dev
# In another terminal:
node test-runner.mjs
```

### 7. Automated UI Testing

```bash
# Start servers first
npm run dev
cd client && npm run dev

# In another terminal:
node selenium-layout-tests.js
```

---

## Test Configuration

The project uses Jest with the following configuration (`jest.config.js`):

- **Preset**: `ts-jest/presets/default-esm` for ES modules
- **Environment**: Node.js
- **Coverage**: HTML, LCOV, and text reports
- **Setup**: Uses `tests/setup.ts` for test environment setup

---

## Test Coverage

The coverage report shows:

- **Statements**: Percentage of code statements executed
- **Branches**: Percentage of conditional branches executed
- **Functions**: Percentage of functions called
- **Lines**: Percentage of lines executed

### Current Coverage Targets

- Overall: Aim for >80% statement coverage
- Critical paths: Aim for >90% coverage
- New features: Require >85% coverage
- UI functionality: 100% coverage via Selenium tests

---

## Test Categories

### 1. Schema Tests (`tests/schema.test.ts`)

Tests Zod schema validation for:
- User data validation
- Student data validation
- Required field validation
- Data type validation

**Example:**
```typescript
test('should validate valid user data', () => {
  const userData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    role: 'parent',
    firstName: 'Test',
    lastName: 'User'
  };
  
  const result = insertUserSchema.safeParse(userData);
  expect(result.success).toBe(true);
});
```

### 2. Storage Tests (`tests/storage.test.ts`)

Tests the in-memory storage system:
- User CRUD operations
- Student CRUD operations
- Data persistence
- Query operations

**Example:**
```typescript
test('should create and retrieve users', async () => {
  const userData = { /* user data */ };
  const user = await storage.createUser(userData);
  expect(user.id).toBeDefined();
  
  const retrieved = await storage.getUser(user.id);
  expect(retrieved?.id).toBe(user.id);
});
```

### 3. API Tests (`tests/api.test.ts`)

Integration tests for API endpoints:
- Authentication flows
- CRUD operations via HTTP
- Session management

### 4. Selenium Tests (`selenium-layout-tests.js`)

Automated UI tests for:
- Role-based navigation
- Sidebar functionality
- Mobile responsiveness
- User authentication flows
- Security verification

**Example:**
```javascript
// Test role-based menu visibility
const visibleItems = navigationItems.filter(item => 
  item.roles.includes(user.role)
);

// Verify restricted items are hidden
const restrictedItems = allMenuItems.filter(item => 
  !user.expectedMenuItems.includes(item)
);
```

---

## Best Practices

### Writing Tests

1. **Use descriptive test names** that explain what is being tested
2. **Test both positive and negative cases**
3. **Verify edge cases and error conditions**
4. **Keep tests independent** - each test should be able to run in isolation
5. **Use appropriate assertions** for the type of test

### Test Organization

1. **Group related tests** using `describe` blocks
2. **Use consistent naming conventions**
3. **Separate unit tests from integration tests**
4. **Keep test files focused** on a single module or feature

### Performance

1. **Run tests in parallel** when possible
2. **Use efficient selectors** in Selenium tests
3. **Minimize setup/teardown overhead**
4. **Cache dependencies** in CI/CD pipelines

### Maintenance

1. **Update tests when features change**
2. **Review test coverage regularly**
3. **Refactor tests to reduce duplication**
4. **Keep test data up to date**

---

## Troubleshooting

### Common Issues

1. **Tests failing intermittently**
   - Add appropriate wait times
   - Check for race conditions
   - Verify test isolation

2. **Selenium element not found**
   - Check if page is fully loaded
   - Verify element selectors
   - Ensure servers are running

3. **Authentication issues**
   - Verify test user credentials
   - Check session configuration
   - Ensure proper cleanup between tests

### Getting Help

1. **Check the test output** for specific error messages
2. **Review the test logs** for debugging information
3. **Verify the test environment** is set up correctly
4. **Consult the documentation** for configuration details

---

## Future Enhancements

### Planned Improvements

1. **Visual regression testing** for UI components
2. **Performance testing** for critical user flows
3. **Accessibility testing** for compliance
4. **Cross-browser testing** for compatibility
5. **API contract testing** for service integration

### Contributing

When adding new tests:

1. **Follow existing patterns** and conventions
2. **Add appropriate documentation**
3. **Update this guide** with new information
4. **Ensure tests are maintainable**
5. **Consider test performance impact**