import { Router, Request, Response } from "express";
import { storage } from "./storage.js";
import { insertUserSchema, insertStudentSchema, insertClassSchema, updateClassSchema, insertAttendanceSchema, qrCodeScanSchema } from "../shared/schema.js";
import { requireAuth, requireRole } from "./middleware.js";

// Extend session interface for Feature 3
declare module "express-session" {
  interface SessionData {
    userId?: number;
    userRole?: string;
  }
}

const router = Router();

// Feature 2: User management routes
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

// Feature 3: Student management routes
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

// Feature 3: Dojo routes
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

// Feature 4: Class management routes
router.get("/classes", requireAuth, async (req: Request, res: Response) => {
  try {
    const userRole = req.session?.userRole;
    const userId = req.session?.userId;

    if (userRole === "instructor") {
      // Instructors can see all classes or filter by their own
      const instructorId = req.query.instructor;
      if (instructorId && parseInt(instructorId as string) === userId) {
        const classes = await storage.getClassesByInstructor(userId);
        res.json(classes);
      } else {
        const classes = await storage.getAllClasses();
        res.json(classes);
      }
    } else {
      // Parents and students can see all available classes
      const classes = await storage.getAllClasses();
      res.json(classes);
    }
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({ error: "Failed to fetch classes" });
  }
});

router.get("/classes/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const classId = parseInt(req.params.id);
    const classData = await storage.getClass(classId);
    
    if (!classData) {
      return res.status(404).json({ error: "Class not found" });
    }

    res.json(classData);
  } catch (error) {
    console.error("Error fetching class:", error);
    res.status(500).json({ error: "Failed to fetch class" });
  }
});

router.post("/classes", requireRole(["instructor"]), async (req: Request, res: Response) => {
  try {
    const classData = insertClassSchema.parse(req.body);
    
    // Validate that the instructor exists and is actually an instructor
    const instructor = await storage.getUser(classData.instructorId);
    if (!instructor || instructor.role !== "instructor") {
      return res.status(400).json({ error: "Invalid instructor ID" });
    }

    // Validate that the dojo exists
    const dojo = await storage.getDojo(classData.dojoId);
    if (!dojo) {
      return res.status(400).json({ error: "Invalid dojo ID" });
    }

    const newClass = await storage.createClass(classData);
    res.status(201).json(newClass);
  } catch (error) {
    console.error("Error creating class:", error);
    res.status(400).json({ error: "Invalid class data" });
  }
});

router.put("/classes/:id", requireRole(["instructor"]), async (req: Request, res: Response) => {
  try {
    const classId = parseInt(req.params.id);
    const existingClass = await storage.getClass(classId);
    
    if (!existingClass) {
      return res.status(404).json({ error: "Class not found" });
    }

    // Only the assigned instructor can update their class
    if (req.session?.userId !== existingClass.instructorId) {
      return res.status(403).json({ error: "Access denied - not your class" });
    }

    const classData = updateClassSchema.parse(req.body);
    const updatedClass = await storage.updateClass(classId, classData);
    
    res.json(updatedClass);
  } catch (error) {
    console.error("Error updating class:", error);
    res.status(400).json({ error: "Invalid class data" });
  }
});

router.delete("/classes/:id", requireRole(["instructor"]), async (req: Request, res: Response) => {
  try {
    const classId = parseInt(req.params.id);
    const existingClass = await storage.getClass(classId);
    
    if (!existingClass) {
      return res.status(404).json({ error: "Class not found" });
    }

    // Only the assigned instructor can delete their class
    if (req.session?.userId !== existingClass.instructorId) {
      return res.status(403).json({ error: "Access denied - not your class" });
    }

    const deleted = await storage.deleteClass(classId);
    if (deleted) {
      res.json({ message: "Class deleted successfully" });
    } else {
      res.status(500).json({ error: "Failed to delete class" });
    }
  } catch (error) {
    console.error("Error deleting class:", error);
    res.status(500).json({ error: "Failed to delete class" });
  }
});

// Get classes by day of week
router.get("/classes/schedule/:day", requireAuth, async (req: Request, res: Response) => {
  try {
    const dayOfWeek = req.params.day.toLowerCase();
    const validDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    
    if (!validDays.includes(dayOfWeek)) {
      return res.status(400).json({ error: "Invalid day of week" });
    }

    const classes = await storage.getClassesByDay(dayOfWeek);
    res.json(classes);
  } catch (error) {
    console.error("Error fetching classes by day:", error);
    res.status(500).json({ error: "Failed to fetch classes" });
  }
});

// Get classes by dojo
router.get("/dojos/:dojoId/classes", requireAuth, async (req: Request, res: Response) => {
  try {
    const dojoId = parseInt(req.params.dojoId);
    const dojo = await storage.getDojo(dojoId);
    
    if (!dojo) {
      return res.status(404).json({ error: "Dojo not found" });
    }

    const classes = await storage.getClassesByDojo(dojoId);
    res.json(classes);
  } catch (error) {
    console.error("Error fetching dojo classes:", error);
    res.status(500).json({ error: "Failed to fetch dojo classes" });
  }
});

// Feature 5: Attendance Management Routes

// GET /api/attendance - Get all attendance records (instructors only)
router.get("/attendance", requireRole(["instructor"]), async (req: Request, res: Response) => {
  try {
    const attendance = await storage.getAllAttendance();
    res.json(attendance);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ error: "Failed to retrieve attendance records" });
  }
});

// GET /api/attendance/:id - Get specific attendance record
router.get("/attendance/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid attendance ID" });
    }

    const attendance = await storage.getAttendance(id);
    if (!attendance) {
      return res.status(404).json({ error: "Attendance record not found" });
    }

    res.json(attendance);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ error: "Failed to retrieve attendance record" });
  }
});

// GET /api/students/:id/attendance - Get attendance records for a student
router.get("/students/:id/attendance", requireAuth, async (req: Request, res: Response) => {
  try {
    const studentId = parseInt(req.params.id);
    if (isNaN(studentId)) {
      return res.status(400).json({ error: "Invalid student ID" });
    }

    // Verify student exists
    const student = await storage.getStudent(studentId);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const attendance = await storage.getAttendanceByStudent(studentId);
    res.json(attendance);
  } catch (error) {
    console.error("Error fetching student attendance:", error);
    res.status(500).json({ error: "Failed to retrieve student attendance" });
  }
});

// GET /api/classes/:id/attendance - Get attendance records for a class
router.get("/classes/:id/attendance", requireAuth, async (req: Request, res: Response) => {
  try {
    const classId = parseInt(req.params.id);
    if (isNaN(classId)) {
      return res.status(400).json({ error: "Invalid class ID" });
    }

    // Verify class exists
    const classInfo = await storage.getClass(classId);
    if (!classInfo) {
      return res.status(404).json({ error: "Class not found" });
    }

    const attendance = await storage.getAttendanceByClass(classId);
    res.json(attendance);
  } catch (error) {
    console.error("Error fetching class attendance:", error);
    res.status(500).json({ error: "Failed to retrieve class attendance" });
  }
});

// POST /api/attendance/qr-scan - QR code check-in
router.post("/attendance/qr-scan", requireAuth, async (req: Request, res: Response) => {
  try {
    const validatedData = qrCodeScanSchema.parse(req.body);
    const { qrCode, classId } = validatedData;

    const attendance = await storage.processQRCodeCheckIn(
      qrCode, 
      classId, 
      req.session.userId
    );

    res.status(201).json({
      message: "Check-in successful",
      attendance
    });
  } catch (error: any) {
    console.error("Error processing QR check-in:", error);
    
    if (error.message === "Invalid QR code format") {
      return res.status(400).json({ error: "Invalid QR code format" });
    }
    if (error.message === "Student not found") {
      return res.status(404).json({ error: "Student not found" });
    }
    if (error.message === "Class not found") {
      return res.status(404).json({ error: "Class not found" });
    }
    if (error.message === "Student does not belong to this dojo") {
      return res.status(400).json({ error: "Student does not belong to this dojo" });
    }
    if (error.message === "Class is not at the student's dojo") {
      return res.status(400).json({ error: "Class is not at the student's dojo" });
    }
    if (error.message === "Student already checked in for this class today") {
      return res.status(409).json({ error: "Student already checked in for this class today" });
    }

    res.status(500).json({ error: "Failed to process QR check-in" });
  }
});

// POST /api/attendance/manual - Manual check-in (instructors only)
router.post("/attendance/manual", requireRole(["instructor"]), async (req: Request, res: Response) => {
  try {
    const validatedData = insertAttendanceSchema.parse({
      ...req.body,
      checkInMethod: "manual",
      checkedInBy: req.session.userId
    });

    // Verify student exists
    const student = await storage.getStudent(validatedData.studentId);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Verify class exists
    const classInfo = await storage.getClass(validatedData.classId);
    if (!classInfo) {
      return res.status(404).json({ error: "Class not found" });
    }

    // Check for duplicate attendance today
    const today = new Date();
    const isDuplicate = await storage.checkDuplicateAttendance(
      validatedData.studentId, 
      validatedData.classId, 
      today
    );
    
    if (isDuplicate) {
      return res.status(409).json({ error: "Student already checked in for this class today" });
    }

    const attendance = await storage.createAttendance(validatedData);

    res.status(201).json({
      message: "Manual check-in successful",
      attendance
    });
  } catch (error) {
    console.error("Error processing manual check-in:", error);
    res.status(500).json({ error: "Failed to process manual check-in" });
  }
});

// GET /api/attendance/reports/date-range - Get attendance by date range (instructors only)
router.get("/attendance/reports/date-range", requireRole(["instructor"]), async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Start date and end date are required" });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    if (start > end) {
      return res.status(400).json({ error: "Start date must be before end date" });
    }

    const attendance = await storage.getAttendanceByDateRange(start, end);
    res.json(attendance);
  } catch (error) {
    console.error("Error fetching attendance by date range:", error);
    res.status(500).json({ error: "Failed to retrieve attendance report" });
  }
});

// Feature 6: Booking Management Routes

// POST /api/classes/book/:id - Book a class for a student
router.post("/classes/book/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const classId = parseInt(req.params.id);
    const { studentId } = req.body;
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!studentId) {
      return res.status(400).json({ error: "Student ID is required" });
    }

    // Validate class exists
    const classInfo = await storage.getClass(classId);
    if (!classInfo) {
      return res.status(404).json({ error: "Class not found" });
    }

    // Validate student exists
    const student = await storage.getStudent(studentId);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Check if user has permission to book for this student
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Students can only book for themselves, parents can book for their children
    if (user.role === "student") {
      if (student.userId !== userId) {
        return res.status(403).json({ error: "Students can only book for themselves" });
      }
    } else if (user.role === "parent") {
      if (student.parentId !== userId) {
        return res.status(403).json({ error: "Parents can only book for their children" });
      }
    } else {
      return res.status(403).json({ error: "Only students and parents can book classes" });
    }

    // Check if student is already booked
    const isBooked = await storage.isStudentBooked(studentId, classId);
    if (isBooked) {
      return res.status(409).json({ error: "Student is already booked for this class" });
    }

    // Check if class is full
    if (classInfo.currentEnrollment >= classInfo.maxCapacity) {
      return res.status(409).json({ error: "Class is full" });
    }

    // Create booking
    const booking = await storage.createBooking({
      studentId,
      classId,
      bookedBy: userId
    });

    // Update class enrollment
    await storage.updateClass(classId, {
      currentEnrollment: classInfo.currentEnrollment + 1
    });

    res.status(201).json({
      message: "Class booked successfully",
      booking
    });
  } catch (error) {
    console.error("Error booking class:", error);
    res.status(500).json({ error: "Failed to book class" });
  }
});

// DELETE /api/classes/book/:id - Cancel a class booking
router.delete("/classes/book/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const classId = parseInt(req.params.id);
    const { studentId } = req.body;
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!studentId) {
      return res.status(400).json({ error: "Student ID is required" });
    }

    // Validate class exists
    const classInfo = await storage.getClass(classId);
    if (!classInfo) {
      return res.status(404).json({ error: "Class not found" });
    }

    // Validate student exists
    const student = await storage.getStudent(studentId);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Check if user has permission to cancel booking for this student
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Students can only cancel their own bookings, parents can cancel for their children
    if (user.role === "student") {
      if (student.userId !== userId) {
        return res.status(403).json({ error: "Students can only cancel their own bookings" });
      }
    } else if (user.role === "parent") {
      if (student.parentId !== userId) {
        return res.status(403).json({ error: "Parents can only cancel bookings for their children" });
      }
    } else {
      return res.status(403).json({ error: "Only students and parents can cancel bookings" });
    }

    // Find and delete the booking
    const bookings = await storage.getBookingsByStudent(studentId);
    const booking = bookings.find(b => b.classId === classId);
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    await storage.deleteBooking(booking.id);

    // Update class enrollment
    await storage.updateClass(classId, {
      currentEnrollment: Math.max(0, classInfo.currentEnrollment - 1)
    });

    res.json({
      message: "Booking cancelled successfully"
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ error: "Failed to cancel booking" });
  }
});

// GET /api/classes/:id/bookings - Get bookings for a class (instructors only)
router.get("/classes/:id/bookings", requireRole(["instructor"]), async (req: Request, res: Response) => {
  try {
    const classId = parseInt(req.params.id);

    // Validate class exists
    const classInfo = await storage.getClass(classId);
    if (!classInfo) {
      return res.status(404).json({ error: "Class not found" });
    }

    const bookings = await storage.getBookingsByClass(classId);
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching class bookings:", error);
    res.status(500).json({ error: "Failed to fetch class bookings" });
  }
});

export default router;