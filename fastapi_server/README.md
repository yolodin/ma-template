# YOLO Dojo FastAPI Server

This is a Python FastAPI implementation of the YOLO Dojo Management System API, providing the same functionality as the Express.js server.

## Features

- **Authentication**: JWT-based authentication with role-based access control
- **User Management**: CRUD operations for users (instructors, parents, students)
- **Student Management**: Manage students with parent relationships
- **Class Management**: Schedule and manage martial arts classes
- **Booking System**: Class enrollment and booking management
- **Attendance Tracking**: QR code and manual attendance tracking
- **Role-Based Access Control**: Different permissions for instructors, parents, and students

## Setup

### Prerequisites

- Python 3.8+
- PostgreSQL database (local or Supabase)
- pip (Python package manager)

### Installation

1. **Clone and navigate to the FastAPI server directory:**
   ```bash
   cd fastapi_server
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your database credentials
   ```

### Database Configuration

For **Supabase PostgreSQL**:
```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

For **Local PostgreSQL**:
```bash
DATABASE_URL=postgresql://username:password@localhost/ma_template
```

### Running the Server

**Option 1: Using the startup script**
```bash
python start.py
```

**Option 2: Using uvicorn directly**
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Option 3: Using the main module**
```bash
python -m main
```

The server will start on `http://localhost:8000` by default.

## API Documentation

Once the server is running, you can access:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/api/health

## Test Users

The server automatically seeds these test users:

| Role | Username | Password |
|------|----------|----------|
| Instructor | instructor | password12377 |
| Parent | parent | parent12377 |
| Student | student1 | student12377 |

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Users
- `GET /api/users` - List users (instructors only)
- `POST /api/users` - Create user (instructors only)
- `GET /api/users/{id}` - Get user profile
- `PUT /api/users/{id}` - Update user profile

### Students
- `GET /api/students` - List students
- `POST /api/students` - Create student
- `GET /api/students/{id}` - Get student details
- `PUT /api/students/{id}` - Update student

### Classes
- `GET /api/classes` - List classes
- `POST /api/classes` - Create class (instructors only)
- `GET /api/classes/{id}` - Get class details
- `PUT /api/classes/{id}` - Update class
- `DELETE /api/classes/{id}` - Delete class

### Bookings
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create booking
- `DELETE /api/bookings/{id}` - Cancel booking

### Attendance
- `GET /api/attendance` - List attendance records
- `POST /api/attendance/qr-checkin` - QR code check-in
- `POST /api/attendance/manual` - Manual check-in (instructors only)

## Role-Based Access Control

### Instructor
- Full access to all endpoints
- Can manage users, students, classes, and attendance
- Can create and manage bookings

### Parent
- Can view and manage their own children
- Can book classes for their children
- Can view attendance for their children
- Cannot access other users' data

### Student
- Can view their own profile and bookings
- Can view their own attendance records
- Cannot access other users' data

## Development

### Project Structure
```
fastapi_server/
├── main.py          # FastAPI application entry point
├── models.py        # Pydantic models and schemas
├── database.py      # Database models and connection
├── auth.py          # Authentication and authorization
├── routes.py        # API route handlers
├── start.py         # Startup script
├── requirements.txt # Python dependencies
├── env.example      # Environment variables template
└── README.md        # This file
```

### Adding New Endpoints

1. Add new models to `models.py`
2. Add database models to `database.py` if needed
3. Add route handlers to `routes.py`
4. Update this README with new endpoint documentation

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify your `DATABASE_URL` in `.env`
   - Ensure PostgreSQL is running
   - Check network connectivity for remote databases

2. **Import Errors**
   - Ensure you're in the correct directory
   - Activate the virtual environment
   - Install dependencies with `pip install -r requirements.txt`

3. **Port Already in Use**
   - Change the port in `.env` or use a different port
   - Kill existing processes using the port

### Logs

The server runs with info-level logging by default. Check the console output for detailed information about requests, errors, and database operations.

## Production Deployment

For production deployment:

1. Set appropriate environment variables
2. Use a production ASGI server like Gunicorn
3. Configure proper CORS settings
4. Set up SSL/TLS certificates
5. Use environment-specific database configurations

Example production command:
```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## Testing

### Running Tests

The project includes comprehensive Python tests using pytest:

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_api.py

# Run specific test
pytest tests/test_api.py::test_login
```

### Test Coverage

The test suite covers:

- ✅ Health check endpoint
- ✅ Authentication (login, invalid credentials)
- ✅ Protected endpoints (students, classes, dojos)
- ✅ Unauthorized access handling
- ✅ Current user endpoint
- ✅ Different user roles (instructor, parent, student)

### Test Configuration

Tests are configured in `pytest.ini` with:
- Automatic test discovery
- Warning suppression
- Verbose output by default

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Users
- `GET /api/users` - List users (instructors only)
- `POST /api/users` - Create user (instructors only)
- `GET /api/users/{id}` - Get user profile
- `PUT /api/users/{id}` - Update user profile

### Students
- `GET /api/students` - List students
- `POST /api/students` - Create student
- `GET /api/students/{id}` - Get student details
- `PUT /api/students/{id}` - Update student
- `GET /api/students/{id}/attendance` - Get student attendance

### Classes
- `GET /api/classes` - List classes
- `POST /api/classes` - Create class (instructors only)
- `GET /api/classes/{id}` - Get class details
- `PUT /api/classes/{id}` - Update class
- `DELETE /api/classes/{id}` - Delete class

### Bookings
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create booking
- `DELETE /api/bookings/{id}` - Delete booking
- `DELETE /api/bookings/{class_id}/{student_id}` - Delete booking by class and student

### Attendance
- `GET /api/attendance` - List attendance records
- `POST /api/attendance/qr-scan` - QR code check-in
- `POST /api/attendance/manual` - Manual check-in (instructors only)

### Dojos
- `GET /api/dojos` - List dojos
- `GET /api/dojos/{id}` - Get dojo details

## Database

The application uses SQLite with SQLAlchemy ORM. The database is automatically initialized on startup with:

- Sample users (instructor, parent, student)
- Sample dojo
- Sample students
- Sample classes

## Development

### Project Structure

```
fastapi_server/
├── main.py              # FastAPI application entry point
├── routes.py            # API route definitions
├── models.py            # Pydantic models and validation
├── database.py          # Database models and connection
├── auth.py              # Authentication and authorization
├── tests/               # Test suite
│   └── test_api.py      # API integration tests
├── requirements.txt     # Python dependencies
├── pytest.ini          # Test configuration
└── README.md           # This file
```

### Adding New Tests

To add new tests:

1. Create test functions in `tests/test_api.py`
2. Use the `TestClient` from FastAPI for HTTP testing
3. Follow the naming convention: `test_*`
4. Use proper assertions and error handling

Example:
```python
def test_new_endpoint():
    response = client.get("/api/new-endpoint")
    assert response.status_code == 200
    assert "expected_data" in response.json()
```

## License

This project is part of the YOLO Dojo management system. 