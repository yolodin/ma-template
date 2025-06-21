import express from "express";
import session from "express-session";
import cors from "cors";
import type { Request, Response, NextFunction } from "express";
import authRoutes from "./auth.js";
const app = express();
const PORT = Number(process.env.PORT) || 5000;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'yolo-dojo-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));
app.use("/api/auth", authRoutes);
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "Yolo Dojo API running" });
});
app.use("*", (_req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Server error:", err);
  res.status(500).json({ message: "Internal server error" });
});
app.listen(PORT, () => {
  console.log(`Yolo Dojo server running on port ${PORT}`);
});