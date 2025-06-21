import { Router } from "express";
import type { Request, Response } from "express";
import { insertUserSchema } from "../shared/schema.js";
import { storage } from "./storage.js";
import { requireAuth, requireRole } from "./middleware.js";

const router = Router();

// Get all users (instructors only)
router.get("/", requireRole(["instructor"]), async (_req: Request, res: Response) => {
  try {
    const users = await storage.getAllUsers();
    // Remove passwords from response
    const safeUsers = users.map(user => ({ ...user, password: undefined }));
    res.json(safeUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Get user by ID (authenticated users can view their own profile, instructors can view any)
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const requestingUser = req.session.userId;
    
    // Users can only view their own profile unless they're an instructor
    const currentUser = await storage.getUser(requestingUser!);
    if (currentUser?.role !== "instructor" && requestingUser !== userId) {
      return res.status(403).json({ message: "Forbidden: Can only view your own profile" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove password from response
    res.json({ ...user, password: undefined });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

// Create new user (instructors only)
router.post("/", requireRole(["instructor"]), async (req: Request, res: Response) => {
  try {
    const userData = insertUserSchema.parse(req.body);
    
    // Check if username already exists
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const newUser = await storage.createUser(userData);
    
    // Remove password from response
    res.status(201).json({ 
      message: "User created successfully", 
      user: { ...newUser, password: undefined } 
    });
  } catch (error) {
    console.error("Error creating user:", error);
    if (error instanceof Error && error.message.includes('validation')) {
      res.status(400).json({ message: "Invalid user data", error: error.message });
    } else {
      res.status(500).json({ message: "Failed to create user" });
    }
  }
});

// Update user (users can update their own profile, instructors can update any)
router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const requestingUser = req.session.userId;
    
    // Users can only update their own profile unless they're an instructor
    const currentUser = await storage.getUser(requestingUser!);
    if (currentUser?.role !== "instructor" && requestingUser !== userId) {
      return res.status(403).json({ message: "Forbidden: Can only update your own profile" });
    }

    const userData = insertUserSchema.partial().parse(req.body);
    
    // If updating username, check if it already exists
    if (userData.username) {
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: "Username already exists" });
      }
    }

    const updatedUser = await storage.updateUser(userId, userData);
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove password from response
    res.json({ 
      message: "User updated successfully", 
      user: { ...updatedUser, password: undefined } 
    });
  } catch (error) {
    console.error("Error updating user:", error);
    if (error instanceof Error && error.message.includes('validation')) {
      res.status(400).json({ message: "Invalid user data", error: error.message });
    } else {
      res.status(500).json({ message: "Failed to update user" });
    }
  }
});

export default router;