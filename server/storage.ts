import { User, InsertUser, Student, InsertStudent, Dojo } from "../shared/schema.js";
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private students: Map<number, Student> = new Map();
  private dojos: Map<number, Dojo> = new Map();
  private currentUserId = 1;
  private currentStudentId = 1;
  private currentDojoId = 1;
  private initialized = false;

  constructor() {
    // Don't call seedData in constructor - use static factory method instead
  }

  static async create(): Promise<MemStorage> {
    const storage = new MemStorage();
    await storage.seedData();
    return storage;
  }

  private async seedData() {
    if (this.initialized) return;
    
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

    // Create parent user for testing
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

    this.initialized = true;
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

  async getDojo(id: number): Promise<Dojo | undefined> {
    return this.dojos.get(id);
  }

  async getAllDojos(): Promise<Dojo[]> {
    return Array.from(this.dojos.values());
  }
}

// Create a singleton instance for the server
let storageInstance: MemStorage | null = null;

export async function getStorage(): Promise<MemStorage> {
  if (!storageInstance) {
    storageInstance = await MemStorage.create();
  }
  return storageInstance;
}

// For backward compatibility, create a default instance that will be initialized when first accessed
let defaultStorage: MemStorage | null = null;

export const storage = {
  async getUser(id: number) {
    if (!defaultStorage) defaultStorage = await MemStorage.create();
    return defaultStorage.getUser(id);
  },
  async getUserByUsername(username: string) {
    if (!defaultStorage) defaultStorage = await MemStorage.create();
    return defaultStorage.getUserByUsername(username);
  },
  async getAllUsers() {
    if (!defaultStorage) defaultStorage = await MemStorage.create();
    return defaultStorage.getAllUsers();
  },
  async createUser(user: InsertUser) {
    if (!defaultStorage) defaultStorage = await MemStorage.create();
    return defaultStorage.createUser(user);
  },
  async updateUser(id: number, user: Partial<InsertUser>) {
    if (!defaultStorage) defaultStorage = await MemStorage.create();
    return defaultStorage.updateUser(id, user);
  },
  async getStudent(id: number) {
    if (!defaultStorage) defaultStorage = await MemStorage.create();
    return defaultStorage.getStudent(id);
  },
  async getStudentsByParent(parentId: number) {
    if (!defaultStorage) defaultStorage = await MemStorage.create();
    return defaultStorage.getStudentsByParent(parentId);
  },
  async getStudentsByDojo(dojoId: number) {
    if (!defaultStorage) defaultStorage = await MemStorage.create();
    return defaultStorage.getStudentsByDojo(dojoId);
  },
  async getAllStudents() {
    if (!defaultStorage) defaultStorage = await MemStorage.create();
    return defaultStorage.getAllStudents();
  },
  async createStudent(student: InsertStudent) {
    if (!defaultStorage) defaultStorage = await MemStorage.create();
    return defaultStorage.createStudent(student);
  },
  async updateStudent(id: number, student: Partial<InsertStudent>) {
    if (!defaultStorage) defaultStorage = await MemStorage.create();
    return defaultStorage.updateStudent(id, student);
  },
  async getDojo(id: number) {
    if (!defaultStorage) defaultStorage = await MemStorage.create();
    return defaultStorage.getDojo(id);
  },
  async getAllDojos() {
    if (!defaultStorage) defaultStorage = await MemStorage.create();
    return defaultStorage.getAllDojos();
  }
};