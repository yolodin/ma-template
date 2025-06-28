# YOLO Dojo Management System

A comprehensive martial arts management system built with modern web technologies, featuring role-based access control and comprehensive testing.

## 🎯 Features

### ✅ Feature 1: Foundation & Authentication
- User authentication with Express sessions
- Password hashing with bcrypt
- **Role-based access control (RBAC)** with three user types:
  - **Instructors**: Full admin access to all features
  - **Parents**: Access to their children's information and class booking
  - **Students**: Access to their own classes and messages
- PostgreSQL database with Drizzle ORM

### ✅ Feature 2: User Management
- User registration and profiles
- CRUD operations for user management
- Role-based permissions and access control
- User session management

### ✅ Feature 3: Student Management
- Student registration and profiles
- Parent-child relationships
- Belt level tracking
- QR code generation for attendance

### ✅ Feature 4: Class Management
- Class scheduling and management
- Instructor assignments
- Capacity management
- Class booking system for parents/students

### ✅ Feature 5: Attendance Tracking
- QR code-based check-ins
- Manual attendance entry for instructors
- Real-time attendance logging
- Attendance reports

### ✅ Feature 6: Frontend Application
- React + Next.js frontend
- Role-based navigation and UI
- Responsive design with Tailwind CSS
- Real-time updates with TanStack Query

## 🔐 Role-Based Access Control (RBAC)

The system implements comprehensive role-based access control:

### **Instructors** 🥋
- **Dashboard**: Full admin view with statistics
- **Students**: Manage all students in the dojo
- **Classes**: Create, edit, and manage all classes
- **Attendance**: Track attendance and manage check-ins
- **Messages**: Send and receive messages

### **Parents** 👨‍👩‍👧‍👦
- **Students**: View and manage their own children only
- **Classes**: Book/unbook classes for their children
- **Messages**: Send and receive messages
- **No Access**: Dashboard, attendance tracking, or other students' data

### **Students** 👦👧
- **Classes**: View available classes and book/unbook
- **Messages**: Send and receive messages
- **No Access**: Dashboard, student management, or attendance tracking

## 🧪 Testing

### Automated Testing Suite

The project includes comprehensive testing at multiple levels:

#### **Unit & Integration Tests**
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:api      # API endpoint tests
npm run test:storage  # Database storage tests
npm run test:schema   # Data validation tests
npm run test:coverage # Tests with coverage report
```

#### **Selenium UI Tests**
```bash
# Run all selenium tests
npm run test:selenium

# List available tests
npm run test:selenium:list

# Run specific test
node run-selenium-tests.js login
node run-selenium-tests.js layout
node run-selenium-tests.js students
```

**Available Selenium Tests:**
- **Login Tests**: Authentication and role-based redirects
- **Layout & Navigation Tests**: Menu visibility and navigation
- **Students Page Tests**: Student management functionality
- **Classes Tests**: Class creation and management
- **Classes Booking Tests**: Booking functionality for parents/students
- **Attendance Tests**: Attendance tracking (instructor only)

### Test Users

Use these pre-configured accounts for testing:

| Role | Username | Password | Access Level |
|------|----------|----------|--------------|
| Instructor | `instructor` | `password12377` | Full access |
| Parent | `parent` | `parent12377` | Limited access |
| Student | `student1` | `student12377` | Basic access |

## 🛠 Technology Stack

- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Authentication**: Express sessions + bcrypt
- **Frontend**: React + Next.js + TypeScript
- **UI Framework**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query + React Context
- **Testing**: Jest + Selenium WebDriver

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Chrome browser (for Selenium tests)

### Setup

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd ma-template
npm install
cd client && npm install
```

2. **Set up database**
   - Create a [Supabase](https://supabase.com) project
   - Get your database connection string
   - Create `.env` file:
```bash
DATABASE_URL="postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
SESSION_SECRET="your-secret-key"
```

3. **Initialize database**
```bash
npm run db:push
```

4. **Start development servers**
```bash
# Terminal 1: Backend server
npm run dev

# Terminal 2: Frontend server
cd client && npm run dev
```

5. **Test the setup**
```bash
# Health check
curl http://localhost:5000/api/health

# Run all tests
npm test
npm run test:selenium
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout  
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users (instructor only)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (instructor only)
- `PUT /api/users/:id` - Update user

### Students
- `GET /api/students` - Get students (filtered by role)
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student

### Classes
- `GET /api/classes` - Get all classes
- `POST /api/classes` - Create class (instructor only)
- `PUT /api/classes/:id` - Update class
- `POST /api/classes/book/:id` - Book class
- `DELETE /api/classes/book/:id` - Unbook class

### Attendance
- `POST /api/attendance/qr-scan` - QR code check-in
- `POST /api/attendance/manual` - Manual check-in (instructor only)

### Health Check
- `GET /api/health` - Server health status

## 🔄 Development Workflow

1. **Feature Development**: Each feature is developed incrementally
2. **Testing**: Comprehensive testing at unit, integration, and UI levels
3. **RBAC**: All features implement proper role-based access control
4. **Documentation**: Features are documented as they're completed

## 📊 Project Status

- ✅ **Authentication & RBAC**: Complete
- ✅ **User Management**: Complete
- ✅ **Student Management**: Complete
- ✅ **Class Management**: Complete
- ✅ **Attendance Tracking**: Complete
- ✅ **Frontend Application**: Complete
- ✅ **Testing Suite**: Complete
- 🔄 **Additional Features**: In planning

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with proper testing
4. Ensure RBAC is properly implemented
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

