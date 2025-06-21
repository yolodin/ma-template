import * as request from 'supertest';
import * as express from 'express';
import * as session from 'express-session';
import { MemStorage } from '../server/storage.js';

// Extend session interface for tests
declare module "express-session" {
  interface SessionData {
    userId?: number;
    userRole?: string;
  }
}

// Create test app with isolated storage
const createTestApp = async () => {
  const app = express();
  
  app.use(express.json());
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  }));

  // Create a fresh storage instance for each test
  const testStorage = await MemStorage.create();
  
  // Override the storage import in auth and routes
  const authRouter = express.Router();
  authRouter.post("/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await testStorage.getUserByUsername(username);
      if (!user || !(await import('bcryptjs')).compare(password, user.password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.userRole = user.role;
      res.json({ 
        message: "Login successful", 
        user: { ...user, password: undefined } 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  authRouter.post("/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  authRouter.get("/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await testStorage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user info" });
    }
  });

  app.use('/api/auth', authRouter);
  
  // Add student routes with test storage
  const studentRouter = express.Router();
  studentRouter.post("/students", async (req, res) => {
    try {
      const studentData = req.body;
      
      // If parent is creating student, set parentId to their own ID
      if (req.session?.userRole === "parent") {
        studentData.parentId = req.session.userId;
      }

      const student = await testStorage.createStudent(studentData);
      res.status(201).json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(400).json({ error: "Invalid student data" });
    }
  });

  app.use('/api', studentRouter);

  return app;
};

describe('API Integration Tests - Student Management System', () => {
  let app: express.Application;

  beforeEach(async () => {
    app = await createTestApp();
  });

  // Helper function to login and get session
  const loginUser = async (username: string, password: string) => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username, password });
    
    expect(response.status).toBe(200);
    return response.headers['set-cookie'];
  };

  describe('Authentication Tests', () => {
    test('should login instructor successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'instructor',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.user.role).toBe('instructor');
      expect(response.body.user.password).toBeUndefined();
    });
  });

  describe('Student API Tests - Instructor Access', () => {
    let instructorCookie: any;

    beforeEach(async () => {
      instructorCookie = await loginUser('instructor', 'password123');
    });

    test('should create student as instructor', async () => {
      const studentData = {
        parentId: 2,
        dojoId: 1,
        beltLevel: 'yellow',
        age: 8
      };

      const response = await request(app)
        .post('/api/students')
        .set('Cookie', instructorCookie)
        .send(studentData);

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.qrCode).toMatch(/^DOJO:1:STUDENT:\d+$/);
      expect(response.body.beltLevel).toBe('yellow');
    });
  });
});