import bcrypt from "bcryptjs";
import type { User, InsertUser } from "../shared/schema.js";
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}
export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private currentUserId = 1;
  constructor() {
    this.seedData();
  }
  private async seedData() {
    const hashedPassword = await bcrypt.hash("password123", 10);
    const instructor: User = {
      id: this.currentUserId++,
      username: "masterkim",
      email: "kim@yolodojo.com",
      password: hashedPassword,
      role: "instructor",
      firstName: "Master",
      lastName: "Kim",
      phone: "(555) 123-4567",
      createdAt: new Date(),
    };
    this.users.set(instructor.id, instructor);
    console.log("Initial data: Master Kim created");
  }
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      id: this.currentUserId++,
      ...insertUser,
      email: insertUser.email ?? null,
      phone: insertUser.phone ?? null,
      password: hashedPassword,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }
}
export const storage = new MemStorage();