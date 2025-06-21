import {
    insertUserSchema,
    insertStudentSchema
} from '../shared/schema.js';
  
  describe('Schema Validation Tests', () => {
    describe('User Schema Validation', () => {
      test('should validate valid user data', () => {
        const validUser = {
          username: 'testuser',
          email: 'test@example.com',
          password: 'hashedpassword',
          role: 'parent',
          firstName: 'Test',
          lastName: 'User'
        };
  
        const result = insertUserSchema.safeParse(validUser);
        expect(result.success).toBe(true);
      });
  
      test('should reject user without required fields', () => {
        const invalidUser = {
          email: 'test@example.com',
          // Missing username, password, role
        };
  
        const result = insertUserSchema.safeParse(invalidUser);
        expect(result.success).toBe(false);
      });
    });
  
    describe('Student Schema Validation', () => {
      test('should validate valid student data', () => {
        const validStudent = {
          parentId: 1,
          dojoId: 1,
          beltLevel: 'yellow',
          age: 10
        };
  
        const result = insertStudentSchema.safeParse(validStudent);
        expect(result.success).toBe(true);
      });
  
      test('should require dojoId', () => {
        const invalidStudent = {
          parentId: 1,
          beltLevel: 'yellow'
          // Missing required dojoId
        };
  
        const result = insertStudentSchema.safeParse(invalidStudent);
        expect(result.success).toBe(false);
      });
    });
  });