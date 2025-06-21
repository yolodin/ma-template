import { MemStorage } from '../server/storage.js';
import { InsertUser, InsertStudent, InsertClass } from '../shared/schema.js';

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

  describe('Class Management', () => {
    let instructorId: number;
    let dojoId: number;
    let classId: number;

    beforeEach(async () => {
      // Use seeded instructor and dojo
      const instructor = await storage.getUserByUsername('instructor');
      instructorId = instructor!.id;
      const dojos = await storage.getAllDojos();
      dojoId = dojos[0].id;
      // Create a class for each test
      const classData: InsertClass = {
        name: 'Advanced Taekwondo',
        description: 'For black belts',
        instructorId,
        dojoId,
        dayOfWeek: 'friday',
        startTime: '20:00',
        endTime: '21:30',
        maxCapacity: 10,
        beltLevelRequired: 'black',
        isActive: true,
      };
      const newClass = await storage.createClass(classData);
      classId = newClass.id;
    });

    test('should create a class', async () => {
      // The beforeEach already creates a class, so just check it exists
      const cls = await storage.getClass(classId);
      expect(cls).toBeDefined();
      expect(cls?.name).toBe('Advanced Taekwondo');
    });

    test('should get class by id', async () => {
      const cls = await storage.getClass(classId);
      expect(cls).toBeDefined();
      expect(cls?.id).toBe(classId);
    });

    test('should get all classes', async () => {
      const classes = await storage.getAllClasses();
      expect(Array.isArray(classes)).toBe(true);
      expect(classes.length).toBeGreaterThanOrEqual(2); // seeded + created
    });

    test('should get classes by instructor', async () => {
      const classes = await storage.getClassesByInstructor(instructorId);
      expect(classes.length).toBeGreaterThanOrEqual(1);
      expect(classes.some(cls => cls.id === classId)).toBe(true);
      expect(classes.every(cls => cls.instructorId === instructorId)).toBe(true);
    });

    test('should get classes by dojo', async () => {
      const classes = await storage.getClassesByDojo(dojoId);
      expect(classes.length).toBeGreaterThanOrEqual(1);
      expect(classes.some(cls => cls.id === classId)).toBe(true);
      expect(classes.every(cls => cls.dojoId === dojoId)).toBe(true);
    });

    test('should get classes by day', async () => {
      const classes = await storage.getClassesByDay('friday');
      expect(classes.length).toBeGreaterThanOrEqual(1);
      expect(classes.some(cls => cls.id === classId)).toBe(true);
      expect(classes.every(cls => cls.dayOfWeek === 'friday')).toBe(true);
    });

    test('should update a class', async () => {
      const updated = await storage.updateClass(classId, { maxCapacity: 25, isActive: false });
      expect(updated).toBeDefined();
      expect(updated?.maxCapacity).toBe(25);
      expect(updated?.isActive).toBe(false);
    });

    test('should delete a class', async () => {
      const deleted = await storage.deleteClass(classId);
      expect(deleted).toBe(true);
      const cls = await storage.getClass(classId);
      expect(cls).toBeUndefined();
    });
  });
});