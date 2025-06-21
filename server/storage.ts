import { User, InsertUser } from "../shared/schema.js";
import bcrypt from "bcryptjs";

// Feature 1-2: Storage interface for user authentication and management
export interface IStorage {
  // Users (Features 1-2)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
}

// In-memory storage implementation for Features 1-2
export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private currentUserId = 1;

  constructor() {
    this.seedData();
  }

  private async seedData() {
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

    // Create parent user for Feature 2 testing
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
}

export const storage = new MemStorage();