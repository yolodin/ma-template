import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - handles instructors, parents, and students
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email"),
  password: text("password").notNull(),
  role: text("role").notNull(), // instructor, parent, student
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Dojos table - supports multiple dojo locations
export const dojos = pgTable("dojos", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Students table - links to users and parents
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // student's own account
  parentId: integer("parent_id").references(() => users.id), // parent's account
  dojoId: integer("dojo_id").references(() => dojos.id).notNull(),
  beltLevel: text("belt_level").notNull().default("white"),
  age: integer("age"),
  qrCode: text("qr_code").notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Feature 4: Classes table for scheduling and management
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  instructorId: integer("instructor_id").references(() => users.id).notNull(),
  dojoId: integer("dojo_id").references(() => dojos.id).notNull(),
  dayOfWeek: text("day_of_week").notNull(), // 'monday', 'tuesday', etc.
  startTime: text("start_time").notNull(), // '18:00'
  endTime: text("end_time").notNull(), // '19:00'
  maxCapacity: integer("max_capacity").notNull().default(20),
  currentEnrollment: integer("current_enrollment").notNull().default(0),
  beltLevelRequired: text("belt_level_required").default("white"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertDojoSchema = createInsertSchema(dojos).omit({
  id: true,
  createdAt: true,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  qrCode: true,
  createdAt: true,
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  currentEnrollment: true,
  createdAt: true,
}).extend({
  dayOfWeek: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// TypeScript types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Dojo = typeof dojos.$inferSelect;
export type InsertDojo = z.infer<typeof insertDojoSchema>;
export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type LoginData = z.infer<typeof loginSchema>;