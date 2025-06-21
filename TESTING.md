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
- **Test Runner** (`test-runner.mjs`) — Manual API endpoint testing (run with `node test-runner.mjs`)

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
- Error handling

**Example:**
```typescript
test('should login instructor successfully', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      username: 'instructor',
      password: 'password123'
    });

  expect(response.status).toBe(200);
  expect(response.body.user.role).toBe('instructor');
});
```

---

## Test Data

### Seed Data

The storage system automatically creates test data:

**Users:**
- `instructor` (username: "instructor", password: "password123")
- `parent` (username: "parent", password: "parent123")

**Dojos:**
- "YOLO Dojo" (ID: 1)

### Test Isolation

Each test suite uses isolated storage instances to prevent test interference.

---

## Debugging Tests

### 1. Verbose Output

```bash
npm run test:verbose
```

### 2. Debug Specific Test

```bash
npx jest --testNamePattern="should login instructor successfully"
```

### 3. Console Logs

Add `console.log()` statements in your tests for debugging.

### 4. Test Timeouts

If tests are timing out, you can increase the timeout:

```typescript
test('slow test', async () => {
  // Your test code
}, 10000); // 10 second timeout
```

---

## Common Issues and Solutions

### 1. Import Errors

**Problem:** `TypeError: (0 , module_1.default) is not a function`

**Solution:** Use namespace imports for ES modules:
```typescript
import * as express from 'express';
```

### 2. Async Storage Issues

**Problem:** Storage methods returning Promises instead of data

**Solution:** Always await storage method calls:
```typescript
const user = await storage.getUserByUsername(username);
```

### 3. Test Isolation Issues

**Problem:** Tests affecting each other

**Solution:** Use fresh storage instances for each test:
```typescript
beforeEach(async () => {
  storage = await MemStorage.create();
});
```

---

## Best Practices

- Group related tests using `describe()` blocks
- Use descriptive test names
- Keep tests focused and atomic
- Use realistic test data
- Clean up test data after tests
- Use factories for complex test objects
- Use specific assertions
- Test both success and failure cases
- Verify error messages and status codes
- Keep tests fast
- Use mocks for external dependencies
- Avoid unnecessary setup/teardown

---

## Continuous Integration

Tests are automatically run in CI/CD pipelines:

- All tests must pass before merging
- Coverage reports are generated
- Test results are reported in pull requests

---

## Adding New Tests

### 1. Create Test File

```typescript
// tests/new-feature.test.ts
import { describe, test, expect, beforeEach } from '@jest/globals';

describe('New Feature Tests', () => {
  beforeEach(async () => {
    // Setup
  });

  test('should do something', async () => {
    // Test implementation
    expect(result).toBe(expected);
  });
});
```

### 2. Update Jest Configuration

If needed, update `jest.config.js` to include new test patterns.

### 3. Run Tests

```bash
npx jest tests/new-feature.test.ts
```

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [TypeScript Testing](https://jestjs.io/docs/getting-started#using-typescript)