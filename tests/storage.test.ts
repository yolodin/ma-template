import { MemStorage } from '../server/storage.js';
import { InsertUser, InsertStudent } from '../shared/schema.js';

describe('MemStorage - Student Management System', () => {
  let storage: MemStorage;

  beforeEach(async () => {
    storage = await MemStorage.create();
  });

  describe('User Management', () => {
    test('should create and retrieve users', async () => {
      const userData: InsertUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'parent',
        firstName: 'Test',
        lastName: 'User',
        phone: '555-1234'
      };

      const user = await storage.createUser(userData);
      expect(user.id).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.role).toBe('parent');

      const retrieved = await storage.getUser(user.id);
      expect(retrieved?.id).toBe(user.id);
    });

    test('should get user by username', async () => {
      const user = await storage.getUserByUsername('instructor');
      expect(user).toBeDefined();
      expect(user?.role).toBe('instructor');
    });
  });

  describe('Student Management', () => {
    test('should create student with auto-generated QR code', async () => {
      const studentData: InsertStudent = {
        parentId: 2,
        dojoId: 1,
        beltLevel: 'yellow',
        age: 10
      };

      const student = await storage.createStudent(studentData);
      expect(student.id).toBeDefined();
      expect(student.qrCode).toMatch(/^DOJO:1:STUDENT:\d+$/);
      expect(student.beltLevel).toBe('yellow');
      expect(student.parentId).toBe(2);
      expect(student.isActive).toBe(true);
    });

    test('should retrieve students by parent', async () => {
      const studentData: InsertStudent = {
        parentId: 2,
        dojoId: 1,
        beltLevel: 'white',
        age: 8
      };

      await storage.createStudent(studentData);
      
      const students = await storage.getStudentsByParent(2);
      expect(students).toHaveLength(1);
      expect(students[0].parentId).toBe(2);
    });
  });
});