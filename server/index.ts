import express from "express";
import session from "express-session";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import type { Request, Response, NextFunction } from "express";
import authRoutes from "./auth.js";
import userRoutes from "./users.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "YOLO Dojo API running" });
});

// Serve basic frontend for testing
app.get("/", (_req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>YOLO Dojo</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .status { color: green; }
        .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; }
        .test { background: #e8f4f8; padding: 15px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <h1>🥋 YOLO Dojo Management System</h1>

      <h2>Available API Endpoints:</h2>
      <div class="endpoint"><strong>POST /api/auth/login</strong> - User login</div>
      <div class="endpoint"><strong>POST /api/auth/logout</strong> - User logout</div>
      <div class="endpoint"><strong>GET /api/auth/me</strong> - Current user info</div>
      <div class="endpoint"><strong>GET /api/users</strong> - List users (instructors only)</div>
      <div class="endpoint"><strong>POST /api/users</strong> - Create user (instructors only)</div>
      <div class="endpoint"><strong>GET /api/users/:id</strong> - Get user profile</div>
      <div class="endpoint"><strong>PUT /api/users/:id</strong> - Update user profile</div>
      
      <h2>Test Users:</h2>
      <div class="test">
        <strong>Instructor:</strong> username "instructor", password "password123"<br>
        <em>Can manage all users and access all endpoints</em>
      </div>
      <div class="test">
        <strong>Parent:</strong> username "parent", password "parent123"<br>
        <em>Can only access own profile</em>
      </div>
      <div class="test">
        <strong>Student:</strong> username "student1", password "student123"<br>
        <em>Can only access own profile</em>
      </div>

      
    </body>
    </html>
  `);
});

// API route not found
app.use("/api/*", (_req: Request, res: Response) => {
  res.status(404).json({ message: "API endpoint not found" });
});

// Catch-all for other routes
app.use("*", (_req: Request, res: Response) => {
  res.redirect("/");
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Server error:", err);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Yolo Dojo server running on port ${PORT}`);
});

export default app;