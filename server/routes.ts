import { Router, Request, Response } from "express";
import { storage } from "./storage.js";
import { insertUserSchema, insertStudentSchema } from "../shared/schema.js";
import { requireAuth, requireRole } from "./middleware.js";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    userRole?: string;
  }
}

const router = Router();

router.get("/users", requireRole(["instructor"]), async (_req: Request, res: Response) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/users/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Only instructors can view any user, others can only view themselves
    if (req.session?.userId !== userId && req.session?.userRole !== "instructor") {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.post("/users", requireRole(["instructor"]), async (req: Request, res: Response) => {
  try {
    const userData = insertUserSchema.parse(req.body);
    const user = await storage.createUser(userData);
    res.status(201).json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(400).json({ error: "Invalid user data" });
  }
});

router.put("/users/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Only instructors can update any user, others can only update themselves
    if (req.session?.userId !== userId && req.session?.userRole !== "instructor") {
      return res.status(403).json({ error: "Access denied" });
    }

    const userData = insertUserSchema.partial().parse(req.body);
    const user = await storage.updateUser(userId, userData);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(400).json({ error: "Invalid user data" });
  }
});

router.get("/students", requireAuth, async (req: Request, res: Response) => {
  try {
    const userRole = req.session?.userRole;
    const userId = req.session?.userId;

    if (userRole === "instructor") {
      // Instructors can see all students
      const students = await storage.getAllStudents();
      res.json(students);
    } else if (userRole === "parent") {
      // Parents can only see their own children
      const students = await storage.getStudentsByParent(userId!);
      res.json(students);
    } else {
      res.status(403).json({ error: "Access denied" });
    }
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

router.get("/students/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const studentId = parseInt(req.params.id);
    const student = await storage.getStudent(studentId);
    
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const userRole = req.session?.userRole;
    const userId = req.session?.userId;

    // Check permissions
    if (userRole === "instructor" || 
        (userRole === "parent" && student.parentId === userId) ||
        (userRole === "student" && student.userId === userId)) {
      res.json(student);
    } else {
      res.status(403).json({ error: "Access denied" });
    }
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ error: "Failed to fetch student" });
  }
});

router.post("/students", requireRole(["instructor", "parent"]), async (req: Request, res: Response) => {
  try {
    const studentData = insertStudentSchema.parse(req.body);
    
    // If parent is creating student, set parentId to their own ID
    if (req.session?.userRole === "parent") {
      studentData.parentId = req.session.userId;
    }

    const student = await storage.createStudent(studentData);
    res.status(201).json(student);
  } catch (error) {
    console.error("Error creating student:", error);
    res.status(400).json({ error: "Invalid student data" });
  }
});

router.put("/students/:id", requireRole(["instructor", "parent"]), async (req: Request, res: Response) => {
  try {
    const studentId = parseInt(req.params.id);
    const existingStudent = await storage.getStudent(studentId);
    
    if (!existingStudent) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Check permissions
    if (req.session?.userRole === "parent" && existingStudent.parentId !== req.session.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const studentData = insertStudentSchema.partial().parse(req.body);
    const student = await storage.updateStudent(studentId, studentData);
    
    res.json(student);
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(400).json({ error: "Invalid student data" });
  }
});

router.get("/dojos", requireAuth, async (_req: Request, res: Response) => {
  try {
    const dojos = await storage.getAllDojos();
    res.json(dojos);
  } catch (error) {
    console.error("Error fetching dojos:", error);
    res.status(500).json({ error: "Failed to fetch dojos" });
  }
});

router.get("/dojos/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const dojoId = parseInt(req.params.id);
    const dojo = await storage.getDojo(dojoId);
    
    if (!dojo) {
      return res.status(404).json({ error: "Dojo not found" });
    }

    res.json(dojo);
  } catch (error) {
    console.error("Error fetching dojo:", error);
    res.status(500).json({ error: "Failed to fetch dojo" });
  }
});

export default router;