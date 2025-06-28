# YOLO Dojo Management System

A comprehensive martial arts management system built with modern web technologies, featuring role-based access control and comprehensive testing. **Built with FastAPI backend and React frontend!**

## 🎯 Features

### ✅ Feature 1: Foundation & Authentication
- User authentication with JWT tokens
- Password hashing with bcrypt
- **Role-based access control (RBAC)** with three user types:
  - **Instructors**: Full admin access to all features
  - **Parents**: Access to their children's information and class booking
  - **Students**: Access to their own classes and messages
- SQLite database with SQLAlchemy ORM

### ✅ Feature 2: User Management
- User registration and profiles
- CRUD operations for user management
- Role-based permissions and access control
- User session management

### ✅ Feature 3: Student Management
- **Comprehensive student registration and profiles**
- **Enhanced student cards** with parent, dojo, and membership information
- **Detailed student profiles** including:
  - Personal information and belt level tracking
  - Parent and dojo relationship details
  - Attendance statistics and history
  - Active class bookings
  - QR code generation for attendance
- **Advanced student creation form** with comprehensive data fields
- **Role-based student access** (parents see only their children)

### ✅ Feature 4: Class Management
- Class scheduling and management
- Instructor assignments
- Capacity management
- **Enrollment-based class access**: Students see only enrolled classes
- **Role-based booking**: Only parents and instructors can manage enrollments

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

## 🎓 Enhanced Student Features

The system now includes comprehensive student management capabilities:

### **Student Cards & Profiles**
- **Rich Student Cards**: Display comprehensive information including parent details, dojo membership, belt level, age, and member since date
- **Detailed Profiles**: Individual student pages with statistics, attendance history, and relationship information
- **Visual Enhancements**: Color-coded belt badges, organized information layout, and responsive design

### **Advanced Student Creation**
- **Comprehensive Form**: Multi-field form including personal information, parent selection, dojo assignment, and martial arts details
- **Dynamic Dropdowns**: Select from existing parents and dojos in the system
- **Validation**: Proper form validation and error handling

### **Student Statistics & Analytics**
- **Attendance Tracking**: Total classes attended and attendance rate calculations
- **Booking Management**: Active class bookings and scheduling information
- **Performance Metrics**: Visual statistics cards for quick insights

### **Data Integration**
- **Cross-Entity Relationships**: Seamless integration between students, parents, dojos, classes, and attendance
- **Real-time Updates**: Immediate reflection of changes across all related data
- **Role-based Filtering**: Appropriate data visibility based on user permissions

## 🚀 FastAPI Backend

The system uses a **FastAPI backend** with the following features:

- **Port**: 8000
- **Authentication**: JWT-based with Python JWT
- **Language**: Python 3.8+
- **Status**: Production-ready
- **Features**: Auto-generated API documentation (Swagger/ReDoc)
- **Database**: SQLite with SQLAlchemy ORM

## 🔐 Role-Based Access Control (RBAC)

The system implements comprehensive role-based access control:

### **Instructors** 🥋
- **Dashboard**: Full admin view with statistics
- **Students**: Manage all students in the dojo
- **Classes**: Create, edit, delete, and manage all classes
- **Enrollment**: Can enroll/drop any student from any class
- **Attendance**: Track attendance and manage check-ins
- **Messages**: Send and receive messages

### **Parents** 👨‍👩‍👧‍👦
- **Students**: View and manage their own children only
- **Classes**: View all classes at their children's dojo and manage enrollment
- **Enrollment**: Can enroll/drop their children from classes
- **Messages**: Send and receive messages
- **No Access**: Dashboard, attendance tracking, or other students' data

### **Students** 👦👧
- **Classes**: View only classes they are enrolled in (no booking/unbooking)
- **Messages**: Send and receive messages
- **No Access**: Dashboard, student management, attendance tracking, or class booking
- **Enrollment**: Only parents and instructors can enroll/drop students from classes

## 🧪 Testing

### Automated Testing Suite

The project includes comprehensive testing at multiple levels:

#### **Python Tests**
```bash
# Run FastAPI tests
cd fastapi_server && python3 -m pytest
```

#### **Selenium UI Tests**
```bash
# Run all selenium tests
node test-runner.mjs

# Run specific test files
node selenium-layout-tests.js
node selenium-classes-tests.js
node selenium-students-tests.js
node selenium-attendance-tests.js
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

### **FastAPI Backend**
- **Backend**: Python + FastAPI + SQLAlchemy
- **Database**: SQLite + SQLAlchemy ORM
- **Authentication**: JWT tokens + passlib/bcrypt

### **Frontend**
- **Framework**: React + Next.js + TypeScript
- **UI Framework**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query + React Context
- **Testing**: Jest + Selenium WebDriver

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.8+
- Chrome browser (for Selenium tests)

### Setup

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd ma-template
npm install
cd client && npm install

# Install FastAPI dependencies
cd fastapi_server && pip3 install -r requirements.txt
```

2. **Start development servers**

**Start FastAPI backend and frontend**
```bash
# Terminal 1: FastAPI server
cd fastapi_server && python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd client && npm run dev
```

## 📡 API Endpoints

The FastAPI backend provides the following endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users (instructor only)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (instructor only)
- `PUT /api/users/:id` - Update user

### Students
- `GET /api/students` - Get students (filtered by role)
- `GET /api/students/:id` - Get comprehensive student profile
- `POST /api/students` - Create student with comprehensive data
- `PUT /api/students/:id` - Update student
- `GET /api/students/:id/attendance` - Get student attendance history

### Classes
- `GET /api/classes` - Get classes (filtered by role: all for instructors, dojo classes for parents, enrolled classes for students)
- `POST /api/classes` - Create class (instructor only)
- `PUT /api/classes/:id` - Update class (instructor only)
- `DELETE /api/classes/:id` - Delete class (instructor only)

### Bookings
- `GET /api/bookings` - Get bookings (filtered by role)
- `POST /api/bookings` - Create booking (parents/instructors only)
- `DELETE /api/bookings/:id` - Delete booking (parents/instructors only)

### Enrollments
- `GET /api/enrollments` - Get enrollments (filtered by role)
- `POST /api/enrollments` - Create enrollment (parents/instructors only)
- `PUT /api/enrollments/:id` - Update enrollment (parents/instructors only)
- `DELETE /api/enrollments/:id` - Delete enrollment (parents/instructors only)

### Attendance
- `GET /api/attendance` - Get attendance records (filtered by role)
- `POST /api/attendance/qr-scan` - QR code check-in
- `POST /api/attendance/manual` - Manual check-in (instructors only)

## 🔄 Development Workflow

1. **Feature Development**: Each feature is developed incrementally
2. **Testing**: Comprehensive testing at unit, integration, and UI levels
3. **RBAC**: All features implement proper role-based access control
4. **Documentation**: Features are documented as they're completed

## 📊 Project Status

- ✅ **Authentication & RBAC**: Complete
- ✅ **User Management**: Complete
- ✅ **Student Management**: Complete
- ✅ **Class Management**: Complete with enrollment-based access
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