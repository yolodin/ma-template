import { User, InsertUser, Student, InsertStudent, Dojo, Class, InsertClass, UpdateClass, Attendance, InsertAttendance, Booking, InsertBooking } from "../shared/schema.js";
import * as bcrypt from "bcryptjs";

// Feature 1-4: Storage interface for user, student, dojo, and class management
export interface IStorage {
  // Users (Features 1-2)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Students (Feature 3)
  getStudent(id: number): Promise<Student | undefined>;
  getStudentsByParent(parentId: number): Promise<Student[]>;
  getStudentsByDojo(dojoId: number): Promise<Student[]>;
  getAllStudents(): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined>;

  // Dojos (Feature 3)
  getDojo(id: number): Promise<Dojo | undefined>;
  getAllDojos(): Promise<Dojo[]>;

  // Classes (Feature 4)
  getClass(id: number): Promise<Class | undefined>;
  getClassesByInstructor(instructorId: number): Promise<Class[]>;
  getClassesByDojo(dojoId: number): Promise<Class[]>;
  getClassesByDay(dayOfWeek: string): Promise<Class[]>;
  getAllClasses(): Promise<Class[]>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: number, classData: UpdateClass): Promise<Class | undefined>;
  deleteClass(id: number): Promise<boolean>;

  // Attendance (Feature 5)
  getAttendance(id: number): Promise<Attendance | undefined>;
  getAttendanceByStudent(studentId: number): Promise<Attendance[]>;
  getAttendanceByClass(classId: number): Promise<Attendance[]>;
  getAttendanceByDojo(dojoId: number): Promise<Attendance[]>;
  getAttendanceByDateRange(startDate: Date, endDate: Date): Promise<Attendance[]>;
  getAllAttendance(): Promise<Attendance[]>;
  createAttendance(attendanceData: InsertAttendance): Promise<Attendance>;
  checkDuplicateAttendance(studentId: number, classId: number, date: Date): Promise<boolean>;
  processQRCodeCheckIn(qrCode: string, classId: number, checkedInBy?: number): Promise<Attendance>;

  // Bookings (Feature 6)
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingsByStudent(studentId: number): Promise<Booking[]>;
  getBookingsByClass(classId: number): Promise<Booking[]>;
  getBookingsByUser(userId: number): Promise<Booking[]>;
  createBooking(bookingData: InsertBooking): Promise<Booking>;
  deleteBooking(id: number): Promise<boolean>;
  isStudentBooked(studentId: number, classId: number): Promise<boolean>;
}

// In-memory storage implementation for Features 1-4
export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private students: Map<number, Student> = new Map();
  private dojos: Map<number, Dojo> = new Map();
  private classes: Map<number, Class> = new Map();
  private attendance: Map<number, Attendance> = new Map();
  private bookings: Map<number, Booking> = new Map();
  private currentUserId = 1;
  private currentStudentId = 1;
  private currentDojoId = 1;
  private currentClassId = 1;
  private currentAttendanceId = 1;
  private currentBookingId = 1;

  constructor() {
    this.seedData();
  }

  private async seedData() {
    // Create initial dojo for Feature 3
    const dojo: Dojo = {
      id: this.currentDojoId++,
      name: "YOLO Dojo",
      address: "123 Martial Arts Way",
      phone: "555-DOJO",
      email: "contact@yolodojo.com",
      createdAt: new Date(),
    };
    this.dojos.set(dojo.id, dojo);

    // Create initial instructor for testing
    const hashedPassword = await bcrypt.hash("password12377", 10);
    const instructor: User = {
      id: this.currentUserId++,
      username: "instructor",
      email: "instructor@yolodojo.com",
      password: hashedPassword,
      role: "instructor",
      firstName: "Master",
      lastName: "Kim",
      phone: "555-0123",
      createdAt: new Date(),
    };
    this.users.set(instructor.id, instructor);

    // Create parent user for Feature 2-3 testing
    const parentPassword = await bcrypt.hash("parent12377", 10);
    const parent: User = {
      id: this.currentUserId++,
      username: "parent",
      email: "parent@yolodojo.com", 
      password: parentPassword,
      role: "parent",
      firstName: "John",
      lastName: "Doe",
      phone: "555-0456",
      createdAt: new Date(),
    };
    this.users.set(parent.id, parent);

    // Create student user for testing
    const studentPassword = await bcrypt.hash("student12377", 10);
    const student: User = {
      id: this.currentUserId++,
      username: "student1",
      email: "student1@yolodojo.com",
      password: studentPassword,
      role: "student",
      firstName: "Alex",
      lastName: "Smith",
      phone: "555-0789",
      createdAt: new Date(),
    };
    this.users.set(student.id, student);

    // Create sample classes for Feature 4
    const beginnerClass: Class = {
      id: this.currentClassId++,
      name: "Beginner Taekwondo",
      description: "Introduction to basic Taekwondo techniques and forms",
      instructorId: instructor.id,
      dojoId: dojo.id,
      dayOfWeek: "monday",
      startTime: "18:00",
      endTime: "19:00",
      maxCapacity: 15,
      currentEnrollment: 0,
      beltLevelRequired: "white",
      isActive: true,
      createdAt: new Date(),
    };
    this.classes.set(beginnerClass.id, beginnerClass);

    const intermediateClass: Class = {
      id: this.currentClassId++,
      name: "Intermediate Taekwondo",
      description: "Advanced techniques and sparring for colored belts",
      instructorId: instructor.id,
      dojoId: dojo.id,
      dayOfWeek: "wednesday",
      startTime: "19:00",
      endTime: "20:30",
      maxCapacity: 12,
      currentEnrollment: 0,
      beltLevelRequired: "yellow",
      isActive: true,
      createdAt: new Date(),
    };
    this.classes.set(intermediateClass.id, intermediateClass);

    // Create sample students for Feature 5 testing
    const student1: Student = {
      id: this.currentStudentId++,
      userId: null,
      parentId: parent.id,
      dojoId: dojo.id,
      beltLevel: "white",
      age: 13,
      qrCode: "DOJO:1:STUDENT:1",
      isActive: true,
      createdAt: new Date(),
    };
    this.students.set(student1.id, student1);

    const student2: Student = {
      id: this.currentStudentId++,
      userId: null,
      parentId: parent.id,
      dojoId: dojo.id,
      beltLevel: "yellow",
      age: 11,
      qrCode: "DOJO:1:STUDENT:2",
      isActive: true,
      createdAt: new Date(),
    };
    this.students.set(student2.id, student2);

  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    
    const user: User = {
      id: this.currentUserId++,
      ...insertUser,
      password: hashedPassword,
      email: insertUser.email || null,
      phone: insertUser.phone || null,
      createdAt: new Date(),
    };

    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      return undefined;
    }

    const updatedUser: User = {
      ...existingUser,
      ...userData,
      password: userData.password ? await bcrypt.hash(userData.password, 10) : existingUser.password,
      email: userData.email !== undefined ? userData.email : existingUser.email,
      phone: userData.phone !== undefined ? userData.phone : existingUser.phone,
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Student methods for Feature 3
  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getStudentsByParent(parentId: number): Promise<Student[]> {
    return Array.from(this.students.values()).filter(student => student.parentId === parentId);
  }

  async getStudentsByDojo(dojoId: number): Promise<Student[]> {
    return Array.from(this.students.values()).filter(student => student.dojoId === dojoId);
  }

  async getAllStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    // Generate unique QR code for attendance tracking
    const qrCode = `DOJO:${insertStudent.dojoId}:STUDENT:${this.currentStudentId}`;
    
    const student: Student = {
      id: this.currentStudentId++,
      ...insertStudent,
      qrCode,
      beltLevel: insertStudent.beltLevel || "white",
      userId: insertStudent.userId || null,
      parentId: insertStudent.parentId || null,
      age: insertStudent.age || null,
      isActive: insertStudent.isActive ?? true,
      createdAt: new Date(),
    };

    this.students.set(student.id, student);
    return student;
  }

  async updateStudent(id: number, studentData: Partial<InsertStudent>): Promise<Student | undefined> {
    const existingStudent = this.students.get(id);
    if (!existingStudent) {
      return undefined;
    }

    const updatedStudent: Student = {
      ...existingStudent,
      ...studentData,
      userId: studentData.userId !== undefined ? studentData.userId : existingStudent.userId,
      parentId: studentData.parentId !== undefined ? studentData.parentId : existingStudent.parentId,
      age: studentData.age !== undefined ? studentData.age : existingStudent.age,
      isActive: studentData.isActive !== undefined ? studentData.isActive : existingStudent.isActive,
    };

    this.students.set(id, updatedStudent);
    return updatedStudent;
  }

  // Dojo methods for Feature 3
  async getDojo(id: number): Promise<Dojo | undefined> {
    return this.dojos.get(id);
  }

  async getAllDojos(): Promise<Dojo[]> {
    return Array.from(this.dojos.values());
  }

  // Class methods for Feature 4
  async getClass(id: number): Promise<Class | undefined> {
    return this.classes.get(id);
  }

  async getClassesByInstructor(instructorId: number): Promise<Class[]> {
    return Array.from(this.classes.values()).filter(cls => cls.instructorId === instructorId);
  }

  async getClassesByDojo(dojoId: number): Promise<Class[]> {
    return Array.from(this.classes.values()).filter(cls => cls.dojoId === dojoId);
  }

  async getClassesByDay(dayOfWeek: string): Promise<Class[]> {
    return Array.from(this.classes.values()).filter(cls => cls.dayOfWeek === dayOfWeek.toLowerCase());
  }

  async getAllClasses(): Promise<Class[]> {
    return Array.from(this.classes.values());
  }

  async createClass(insertClass: InsertClass): Promise<Class> {
    const newClass: Class = {
      id: this.currentClassId++,
      ...insertClass,
      description: insertClass.description || null,
      currentEnrollment: 0,
      maxCapacity: insertClass.maxCapacity || 20,
      beltLevelRequired: insertClass.beltLevelRequired || "white",
      isActive: insertClass.isActive ?? true,
      createdAt: new Date(),
    };

    this.classes.set(newClass.id, newClass);
    return newClass;
  }

  async updateClass(id: number, classData: UpdateClass): Promise<Class | undefined> {
    const existingClass = this.classes.get(id);
    if (!existingClass) {
      return undefined;
    }

    const updatedClass: Class = {
      ...existingClass,
      ...classData,
      maxCapacity: classData.maxCapacity !== undefined ? classData.maxCapacity : existingClass.maxCapacity,
      beltLevelRequired: classData.beltLevelRequired !== undefined ? classData.beltLevelRequired : existingClass.beltLevelRequired,
      isActive: classData.isActive !== undefined ? classData.isActive : existingClass.isActive,
    };

    this.classes.set(id, updatedClass);
    return updatedClass;
  }

  async deleteClass(id: number): Promise<boolean> {
    return this.classes.delete(id);
  }

  // Feature 5: Attendance Management Methods
  async getAttendance(id: number): Promise<Attendance | undefined> {
    return this.attendance.get(id);
  }

  async getAttendanceByStudent(studentId: number): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(attendance => attendance.studentId === studentId);
  }

  async getAttendanceByClass(classId: number): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(attendance => attendance.classId === classId);
  }

  async getAttendanceByDojo(dojoId: number): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(attendance => attendance.dojoId === dojoId);
  }

  async getAttendanceByDateRange(startDate: Date, endDate: Date): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(attendance => {
      const checkInTime = new Date(attendance.checkInTime);
      return checkInTime >= startDate && checkInTime <= endDate;
    });
  }

  async getAllAttendance(): Promise<Attendance[]> {
    return Array.from(this.attendance.values());
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const attendance: Attendance = {
      id: this.currentAttendanceId++,
      ...insertAttendance,
      checkInTime: insertAttendance.checkInTime || new Date(),
      notes: insertAttendance.notes || null,
      checkedInBy: insertAttendance.checkedInBy || null,
      createdAt: new Date()
    };
    this.attendance.set(attendance.id, attendance);
    return attendance;
  }

  async checkDuplicateAttendance(studentId: number, classId: number, date: Date): Promise<boolean> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAttendance = Array.from(this.attendance.values()).find(attendance => 
      attendance.studentId === studentId && 
      attendance.classId === classId &&
      attendance.checkInTime >= startOfDay &&
      attendance.checkInTime <= endOfDay
    );

    return !!existingAttendance;
  }

  async processQRCodeCheckIn(qrCode: string, classId: number, checkedInBy?: number): Promise<Attendance> {
    // Parse QR code format: DOJO:{dojoId}:STUDENT:{studentId}
    const qrMatch = qrCode.match(/^DOJO:(\d+):STUDENT:(\d+)$/);
    if (!qrMatch) {
      throw new Error("Invalid QR code format");
    }

    const dojoId = parseInt(qrMatch[1]);
    const studentId = parseInt(qrMatch[2]);

    // Validate student exists
    const student = await this.getStudent(studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    // Validate class exists
    const classInfo = await this.getClass(classId);
    if (!classInfo) {
      throw new Error("Class not found");
    }

    // Validate student belongs to the dojo
    if (student.dojoId !== dojoId) {
      throw new Error("Student does not belong to this dojo");
    }

    // Validate class is at the correct dojo
    if (classInfo.dojoId !== dojoId) {
      throw new Error("Class is not at the student's dojo");
    }

    // Check for duplicate attendance today
    const today = new Date();
    const isDuplicate = await this.checkDuplicateAttendance(studentId, classId, today);
    if (isDuplicate) {
      throw new Error("Student already checked in for this class today");
    }

    // Create attendance record
    const attendanceData: InsertAttendance = {
      studentId,
      classId,
      dojoId,
      checkInMethod: "qr_code",
      checkedInBy
    };

    return await this.createAttendance(attendanceData);
  }

  // Bookings (Feature 6)
  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getBookingsByStudent(studentId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.studentId === studentId);
  }

  async getBookingsByClass(classId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.classId === classId);
  }

  async getBookingsByUser(userId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.bookedBy === userId);
  }

  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    const booking: Booking = {
      id: this.currentBookingId++,
      studentId: bookingData.studentId,
      classId: bookingData.classId,
      bookedBy: bookingData.bookedBy,
      isActive: bookingData.isActive ?? true,
      bookedAt: new Date(),
      createdAt: new Date()
    };
    this.bookings.set(booking.id, booking);
    return booking;
  }

  async deleteBooking(id: number): Promise<boolean> {
    return this.bookings.delete(id);
  }

  async isStudentBooked(studentId: number, classId: number): Promise<boolean> {
    const bookings = await this.getBookingsByStudent(studentId);
    return bookings.some(booking => booking.classId === classId);
  }
}

export const storage = new MemStorage();