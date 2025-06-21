// Test setup and configuration
import { beforeAll, afterAll, beforeEach } from '@jest/globals';
// Global test configuration
beforeAll(() => {
  // Suppress console logs during testing
  console.log = jest.fn();
  console.error = jest.fn();
});
afterAll(() => {
  // Restore console logs
  jest.restoreAllMocks();
});
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});
// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret-key';