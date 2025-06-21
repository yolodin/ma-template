# Yolo Dojo Management System

A comprehensive Taekwondo yolo management system built with modern web technologies and feature-based development.

## Features (Built Incrementally)

### ✅ Feature 1: Foundation & Authentication
- User authentication with Express sessions
- Password hashing with bcrypt
- Role-based access control (instructor, parent, student)
- PostgreSQL database with Drizzle ORM

### 🔄 Feature 2: User Management (In Progress)
- User registration and profiles
- CRUD operations for user management
- Role-based permissions

### 📋 Planned Features
- **Student Management**: Registration, profiles, and progress tracking
- **QR Code Check-ins**: Contactless attendance tracking
- **Class Scheduling**: Manage classes and instructor assignments
- **Belt Testing**: Comprehensive testing system with scoring
- **Parent Portal**: Parents can track their children's progress
- **Attendance Tracking**: Real-time attendance logging and reports

## Technology Stack

- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Supabase) + Drizzle ORM
- **Authentication**: Express sessions + bcrypt password hashing
- **Frontend**: React + TypeScript + Vite (to be built)
- **UI Framework**: Standard CSS/Tailwind (no platform dependencies)
- **State Management**: TanStack Query + React Context

## Development Approach

This project is built with **feature-based development** - each major feature is developed incrementally with proper version control and testing.

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Supabase recommended)

### Setup

1. **Clone and install dependencies**
```bash
git clone
cd into project
npm install
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

4. **Start development server**
```bash
npm run dev
```

5. **Test the setup**
```bash
# Health check
curl http://localhost:5000/api/health

# Test login (default instructor account)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"masterkim","password":"password123"}'
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout  
- `GET /api/auth/me` - Get current user

### Health Check
- `GET /api/health` - Server health status

## Development Progress

