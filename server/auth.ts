import { Router } from "express";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { loginSchema } from "../shared/schema.js";
import { storage } from "./storage.js";

const router = Router();

// Extend session interface
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

// Login endpoint
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    
    const user = await storage.getUserByUsername(username);
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    req.session.userId = user.id;
    res.json({ 
      message: "Login successful", 
      user: { ...user, password: undefined } 
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(400).json({ message: "Invalid login data" });
  }
});

// Logout endpoint
router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Failed to logout" });
    }
    res.json({ message: "Logout successful" });
  });
});

// Get current user
router.get("/me", async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: { ...user, password: undefined } });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Failed to get user info" });
  }
});

export default router;