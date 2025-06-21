import { User, InsertUser, Student, InsertStudent, Dojo, Class, InsertClass } from "../shared/schema.js";
import * as bcrypt from "bcryptjs";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  getStudent(id: number): Promise<Student | undefined>;
  getStudentsByParent(parentId: number): Promise<Student[]>;
  getStudentsByDojo(dojoId: number): Promise<Student[]>;
  getAllStudents(): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined>;

  getDojo(id: number): Promise<Dojo | undefined>;
  getAllDojos(): Promise<Dojo[]>;

  getClass(id: number): Promise<Class | undefined>;
  getClassesByInstructor(instructorId: number): Promise<Class[]>;
  getClassesByDojo(dojoId: number): Promise<Class[]>;
  getClassesByDay(dayOfWeek: string): Promise<Class[]>;
  getAllClasses(): Promise<Class[]>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: number, classData: Partial<InsertClass>): Promise<Class | undefined>;
  deleteClass(id: number): Promise<boolean>;
}

// In-memory storage implementation for Features 1-4
export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private students: Map<number, Student> = new Map();
  private dojos: Map<number, Dojo> = new Map();
  private classes: Map<number, Class> = new Map();
  private currentUserId = 1;
  private currentStudentId = 1;
  private currentDojoId = 1;
  private currentClassId = 1;

  private constructor() {
    // Do not call seedData here; use the factory method
  }

  static async create(): Promise<MemStorage> {
    const storage = new MemStorage();
    await storage.seedData();
    return storage;
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
    const hashedPassword = await bcrypt.hash("password123", 10);
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
    const parentPassword = await bcrypt.hash("parent123", 10);
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

    console.log("Features 1-4 ready: Authentication + User Management + Student Management + Class Management");
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

  async updateClass(id: number, classData: Partial<InsertClass>): Promise<Class | undefined> {
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
}

export const storage = new MemStorage();