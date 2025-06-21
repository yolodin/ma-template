import { storage } from '../server/storage.js';
import { InsertUser, InsertStudent, InsertClass, InsertAttendance } from '../shared/schema.js';

describe('MemStorage - Student Management System', () => {
  beforeEach(async () => {
    // Reset storage to initial state for each test
    // This is handled by the storage's seeded data
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

  describe('Attendance Management', () => {
    let instructorId: number;
    let dojoId: number;
    let classId: number;
    let studentId: number;
    let studentQRCode: string;
    let attendanceId: number;

    beforeEach(async () => {
      // Use seeded instructor and dojo
      const instructor = await storage.getUserByUsername('instructor');
      instructorId = instructor!.id;
      const dojos = await storage.getAllDojos();
      dojoId = dojos[0].id;
      
      // Create a class for testing
      const classData: InsertClass = {
        name: 'Test Class',
        description: 'For testing attendance',
        instructorId,
        dojoId,
        dayOfWeek: 'monday',
        startTime: '18:00',
        endTime: '19:00',
        maxCapacity: 15,
        beltLevelRequired: 'white',
        isActive: true,
      };
      const newClass = await storage.createClass(classData);
      classId = newClass.id;

      // Create a student for testing
      const studentData: InsertStudent = {
        parentId: 2, // parent from seed data
        dojoId,
        beltLevel: 'white',
        age: 10
      };
      const student = await storage.createStudent(studentData);
      studentId = student.id;
      studentQRCode = student.qrCode;
    });

    test('should create manual attendance', async () => {
      const attendanceData: InsertAttendance = {
        studentId,
        classId,
        dojoId,
        checkInMethod: 'manual',
        notes: 'Late arrival',
        checkedInBy: instructorId
      };
      
      const attendance = await storage.createAttendance(attendanceData);
      expect(attendance.id).toBeDefined();
      expect(attendance.studentId).toBe(studentId);
      expect(attendance.classId).toBe(classId);
      expect(attendance.checkInMethod).toBe('manual');
      expect(attendance.notes).toBe('Late arrival');
      expect(attendance.checkedInBy).toBe(instructorId);
      attendanceId = attendance.id;
    });

    test('should process QR code check-in', async () => {
      const attendance = await storage.processQRCodeCheckIn(studentQRCode, classId, instructorId);
      expect(attendance.id).toBeDefined();
      expect(attendance.studentId).toBe(studentId);
      expect(attendance.classId).toBe(classId);
      expect(attendance.checkInMethod).toBe('qr_code');
      expect(attendance.checkedInBy).toBe(instructorId);
      attendanceId = attendance.id;
    });

    test('should reject invalid QR code format', async () => {
      await expect(storage.processQRCodeCheckIn('INVALID:QR:CODE', classId))
        .rejects.toThrow('Invalid QR code format');
    });

    test('should reject QR code for non-existent student', async () => {
      const invalidQR = 'DOJO:1:STUDENT:999';
      await expect(storage.processQRCodeCheckIn(invalidQR, classId))
        .rejects.toThrow('Student not found');
    });

    test('should reject QR code for non-existent class', async () => {
      await expect(storage.processQRCodeCheckIn(studentQRCode, 999))
        .rejects.toThrow('Class not found');
    });

    test('should reject QR code for wrong dojo', async () => {
      // Create a student at the seeded dojo
      const otherStudentData: InsertStudent = {
        parentId: 2,
        dojoId: 1,
        beltLevel: 'white',
        age: 10
      };
      const otherStudent = await storage.createStudent(otherStudentData);
      // Forge a QR code with a different dojoId (simulate student from another dojo)
      const fakeQRCode = `DOJO:999:STUDENT:${otherStudent.id}`;
      // Attempt to check in to a class at the seeded dojo
      await expect(storage.processQRCodeCheckIn(fakeQRCode, classId))
        .rejects.toThrow('Student does not belong to this dojo');
    });

    test('should prevent duplicate attendance on same day', async () => {
      // First check-in should succeed
      await storage.processQRCodeCheckIn(studentQRCode, classId);
      
      // Second check-in should fail
      await expect(storage.processQRCodeCheckIn(studentQRCode, classId))
        .rejects.toThrow('Student already checked in for this class today');
    });

    test('should check for duplicate attendance', async () => {
      // No attendance yet, should return false
      const isDuplicate = await storage.checkDuplicateAttendance(studentId, classId, new Date());
      expect(isDuplicate).toBe(false);

      // Create attendance
      await storage.createAttendance({
        studentId,
        classId,
        dojoId,
        checkInMethod: 'manual'
      });

      // Now should return true
      const isDuplicateAfter = await storage.checkDuplicateAttendance(studentId, classId, new Date());
      expect(isDuplicateAfter).toBe(true);
    });

    test('should get attendance by ID', async () => {
      const attendance = await storage.createAttendance({
        studentId,
        classId,
        dojoId,
        checkInMethod: 'manual'
      });
      
      const retrieved = await storage.getAttendance(attendance.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(attendance.id);
    });

    test('should get attendance by student', async () => {
      await storage.createAttendance({
        studentId,
        classId,
        dojoId,
        checkInMethod: 'manual'
      });

      const attendance = await storage.getAttendanceByStudent(studentId);
      expect(attendance.length).toBe(1);
      expect(attendance[0].studentId).toBe(studentId);
    });

    test('should get attendance by class', async () => {
      await storage.createAttendance({
        studentId,
        classId,
        dojoId,
        checkInMethod: 'manual'
      });

      const attendance = await storage.getAttendanceByClass(classId);
      expect(attendance.length).toBe(1);
      expect(attendance[0].classId).toBe(classId);
    });

    test('should get attendance by dojo', async () => {
      await storage.createAttendance({
        studentId,
        classId,
        dojoId,
        checkInMethod: 'manual'
      });

      const attendance = await storage.getAttendanceByDojo(dojoId);
      expect(attendance.length).toBe(1);
      expect(attendance[0].dojoId).toBe(dojoId);
    });

    test('should get attendance by date range', async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Create attendance for today
      await storage.createAttendance({
        studentId,
        classId,
        dojoId,
        checkInMethod: 'manual',
        checkInTime: today
      });

      // Create attendance for tomorrow
      await storage.createAttendance({
        studentId,
        classId,
        dojoId,
        checkInMethod: 'manual',
        checkInTime: tomorrow
      });

      // Get attendance for today only
      const todayAttendance = await storage.getAttendanceByDateRange(today, today);
      expect(todayAttendance.length).toBe(1);

      // Get attendance for both days
      const bothDaysAttendance = await storage.getAttendanceByDateRange(today, tomorrow);
      expect(bothDaysAttendance.length).toBe(2);
    });

    test('should get all attendance', async () => {
      await storage.createAttendance({
        studentId,
        classId,
        dojoId,
        checkInMethod: 'manual'
      });

      const allAttendance = await storage.getAllAttendance();
      expect(Array.isArray(allAttendance)).toBe(true);
      expect(allAttendance.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle multiple students in same class', async () => {
      // Create second student
      const student2Data: InsertStudent = {
        parentId: 2,
        dojoId,
        beltLevel: 'yellow',
        age: 12
      };
      const student2 = await storage.createStudent(student2Data);

      // Check in both students
      await storage.processQRCodeCheckIn(studentQRCode, classId);
      await storage.processQRCodeCheckIn(student2.qrCode, classId);

      // Verify both are recorded
      const classAttendance = await storage.getAttendanceByClass(classId);
      expect(classAttendance.length).toBe(2);
      expect(classAttendance.some(a => a.studentId === studentId)).toBe(true);
      expect(classAttendance.some(a => a.studentId === student2.id)).toBe(true);
    });
  });
});