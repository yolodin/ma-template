import express from "express";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { storage } from "./storage.js";
import { loginSchema } from "../shared/schema.js";
const router = express.Router();
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    req.session.userId = user.id;
    const { password: _, ...userInfo } = user;
    res.json({ user: userInfo });
  } catch (error) {
    res.status(400).json({ message: "Invalid request" });
  }
});
router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});
router.get("/me", async (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const { password: _, ...userInfo } = user;
  res.json({ user: userInfo });
});
export default router;