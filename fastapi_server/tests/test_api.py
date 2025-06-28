import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

import pytest
from fastapi.testclient import TestClient
from main import app
from database import init_db
import asyncio

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Initialize database before running tests"""
    asyncio.run(init_db())

@pytest.fixture
def clean_enrollments():
    """Clean up enrollments before each enrollment test"""
    # Login as instructor to get access
    login_response = client.post("/api/auth/login", json={
        "username": "instructor",
        "password": "password12377"
    })
    token = login_response.json()["accessToken"]
    
    # Get all enrollments
    response = client.get("/api/enrollments", headers={"Authorization": f"Bearer {token}"})
    if response.status_code == 200:
        enrollments = response.json()
        # Delete each enrollment
        for enrollment in enrollments:
            client.delete(f"/api/enrollments/{enrollment['id']}", headers={"Authorization": f"Bearer {token}"})
    
    yield  # This allows the test to run
    
    # Optionally clean up after test too
    # (keeping this empty for now as we want to see test results)

def test_health():
    """Test health check endpoint"""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"

def test_login():
    """Test successful login"""
    response = client.post("/api/auth/login", json={
        "username": "instructor",
        "password": "password12377"
    })
    assert response.status_code == 200
    data = response.json()
    assert "accessToken" in data
    assert data["user"]["role"] == "instructor"

def test_login_invalid_credentials():
    """Test login with invalid credentials"""
    response = client.post("/api/auth/login", json={
        "username": "instructor",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

def test_students_authenticated():
    """Test accessing students endpoint with authentication"""
    # Login first
    login_response = client.post("/api/auth/login", json={
        "username": "instructor",
        "password": "password12377"
    })
    token = login_response.json()["accessToken"]
    
    # Access students endpoint
    response = client.get("/api/students", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    students = response.json()
    assert isinstance(students, list)

def test_student_creation():
    """Test creating a new student"""
    # Login as instructor
    login_response = client.post("/api/auth/login", json={
        "username": "instructor",
        "password": "password12377"
    })
    token = login_response.json()["accessToken"]
    
    # Create student
    student_data = {
        "parentId": 2,
        "dojoId": 1,
        "beltLevel": "white",
        "age": 10
    }
    response = client.post("/api/students", json=student_data, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    student = response.json()
    assert student["beltLevel"] == "white"
    assert student["age"] == 10

def test_student_profile():
    """Test accessing individual student profile"""
    # Login first
    login_response = client.post("/api/auth/login", json={
        "username": "instructor",
        "password": "password12377"
    })
    token = login_response.json()["accessToken"]
    
    # Access student profile
    response = client.get("/api/students/1", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    student = response.json()
    assert "id" in student

def test_classes_authenticated():
    """Test accessing classes endpoint with authentication"""
    # Login first
    login_response = client.post("/api/auth/login", json={
        "username": "instructor",
        "password": "password12377"
    })
    token = login_response.json()["accessToken"]
    
    # Access classes endpoint
    response = client.get("/api/classes", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    classes = response.json()
    assert isinstance(classes, list)

def test_dojos_authenticated():
    """Test accessing dojos endpoint with authentication"""
    # Login first
    login_response = client.post("/api/auth/login", json={
        "username": "instructor",
        "password": "password12377"
    })
    token = login_response.json()["accessToken"]
    
    # Access dojos endpoint
    response = client.get("/api/dojos", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    dojos = response.json()
    assert isinstance(dojos, list)

def test_users_authenticated():
    """Test accessing users endpoint with authentication"""
    # Login first
    login_response = client.post("/api/auth/login", json={
        "username": "instructor",
        "password": "password12377"
    })
    token = login_response.json()["accessToken"]
    
    # Access users endpoint
    response = client.get("/api/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    users = response.json()
    assert isinstance(users, list)

def test_unauthorized_access():
    """Test accessing protected endpoints without authentication"""
    response = client.get("/api/students")
    assert response.status_code == 403

def test_current_user():
    """Test getting current user information"""
    # Login first
    login_response = client.post("/api/auth/login", json={
        "username": "instructor",
        "password": "password12377"
    })
    token = login_response.json()["accessToken"]
    
    # Get current user
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    user = response.json()
    assert user["username"] == "instructor"

def test_parent_login():
    """Test parent login"""
    response = client.post("/api/auth/login", json={
        "username": "parent",
        "password": "parent12377"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "parent"

def test_student_login():
    """Test student login"""
    response = client.post("/api/auth/login", json={
        "username": "student1",
        "password": "student12377"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "student"

def test_parent_student_access():
    """Test parent accessing their children's data"""
    # Login as parent
    login_response = client.post("/api/auth/login", json={
        "username": "parent",
        "password": "parent12377"
    })
    token = login_response.json()["accessToken"]
    
    # Access students (should only see their children)
    response = client.get("/api/students", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200

def test_student_attendance():
    """Test accessing student attendance"""
    # Login as instructor
    login_response = client.post("/api/auth/login", json={
        "username": "instructor",
        "password": "password12377"
    })
    token = login_response.json()["accessToken"]
    
    # Access student attendance
    response = client.get("/api/students/1/attendance", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    attendance = response.json()
    assert isinstance(attendance, list)

def test_student_deletion():
    """Test deleting a student"""
    # Login as instructor
    login_response = client.post("/api/auth/login", json={
        "username": "instructor",
        "password": "password12377"
    })
    token = login_response.json()["accessToken"]
    
    # Create a student first
    student_data = {
        "parentId": 2,
        "dojoId": 1,
        "beltLevel": "white",
        "age": 12
    }
    create_response = client.post("/api/students", json=student_data, headers={"Authorization": f"Bearer {token}"})
    student_id = create_response.json()["id"]
    
    # Delete the student
    response = client.delete(f"/api/students/{student_id}", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200

def test_class_deletion():
    """Test deleting a class"""
    # Login as instructor
    login_response = client.post("/api/auth/login", json={
        "username": "instructor",
        "password": "password12377"
    })
    token = login_response.json()["accessToken"]
    
    # Create a class first
    class_data = {
        "name": "Test Class",
        "description": "Test class for deletion",
        "instructorId": 1,
        "dojoId": 1,
        "dayOfWeek": "monday",
        "startTime": "18:00",
        "endTime": "19:00",
        "maxCapacity": 10,
        "beltLevelRequired": "white"
    }
    create_response = client.post("/api/classes", json=class_data, headers={"Authorization": f"Bearer {token}"})
    class_id = create_response.json()["id"]
    
    # Delete the class
    response = client.delete(f"/api/classes/{class_id}", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200

# New enrollment tests
def test_enrollments_authenticated():
    """Test accessing enrollments endpoint with authentication"""
    # Login as instructor
    login_response = client.post("/api/auth/login", json={
        "username": "instructor",
        "password": "password12377"
    })
    token = login_response.json()["accessToken"]
    
    # Access enrollments endpoint
    response = client.get("/api/enrollments", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    enrollments = response.json()
    assert isinstance(enrollments, list)

def test_student_enrollments():
    """Test accessing enrollments for a specific student"""
    # Login as instructor
    login_response = client.post("/api/auth/login", json={
        "username": "instructor",
        "password": "password12377"
    })
    token = login_response.json()["accessToken"]
    
    # Access student enrollments
    response = client.get("/api/students/1/enrollments", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    enrollments = response.json()
    assert isinstance(enrollments, list)

def test_enrollment_creation(clean_enrollments):
    """Test creating a new enrollment"""
    # Login as instructor
    login_response = client.post("/api/auth/login", json={
        "username": "instructor",
        "password": "password12377"
    })
    token = login_response.json()["accessToken"]
    
    # Create enrollment
    enrollment_data = {
        "studentId": 1,
        "classId": 1,
        "status": "enrolled",
        "enrolledBy": 1,
        "enrollmentDate": "2024-01-01T00:00:00Z",
        "startDate": "2024-01-01T00:00:00Z",
        "endDate": "2024-12-31T00:00:00Z",
        "notes": "Test enrollment",
        "attendanceCount": 0,
        "totalSessions": 0
    }
    response = client.post("/api/enrollments", json=enrollment_data, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    enrollment = response.json()
    assert enrollment["status"] == "enrolled"
    assert enrollment["studentId"] == 1
    assert enrollment["classId"] == 1

def test_enrollment_update(clean_enrollments):
    """Test updating an enrollment"""
    # Login as instructor
    login_response = client.post("/api/auth/login", json={
        "username": "instructor",
        "password": "password12377"
    })
    token = login_response.json()["accessToken"]
    
    # Create enrollment first
    enrollment_data = {
        "studentId": 1,
        "classId": 1,
        "status": "enrolled",
        "enrolledBy": 1,
        "enrollmentDate": "2024-01-01T00:00:00Z",
        "notes": "Initial enrollment"
    }
    create_response = client.post("/api/enrollments", json=enrollment_data, headers={"Authorization": f"Bearer {token}"})
    enrollment_id = create_response.json()["id"]
    
    # Update enrollment
    update_data = {
        "status": "waitlisted",
        "notes": "Updated enrollment"
    }
    response = client.put(f"/api/enrollments/{enrollment_id}", json=update_data, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    enrollment = response.json()
    assert enrollment["status"] == "waitlisted"
    assert enrollment["notes"] == "Updated enrollment"

def test_enrollment_deletion(clean_enrollments):
    """Test deleting an enrollment"""
    # Login as instructor
    login_response = client.post("/api/auth/login", json={
        "username": "instructor",
        "password": "password12377"
    })
    token = login_response.json()["accessToken"]
    
    # Create enrollment first
    enrollment_data = {
        "studentId": 1,
        "classId": 1,
        "status": "enrolled",
        "enrolledBy": 1,
        "enrollmentDate": "2024-01-01T00:00:00Z"
    }
    create_response = client.post("/api/enrollments", json=enrollment_data, headers={"Authorization": f"Bearer {token}"})
    enrollment_id = create_response.json()["id"]
    
    # Delete enrollment
    response = client.delete(f"/api/enrollments/{enrollment_id}", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200

def test_enrollment_permissions(clean_enrollments):
    """Test enrollment permission restrictions"""
    # Login as parent
    login_response = client.post("/api/auth/login", json={
        "username": "parent",
        "password": "parent12377"
    })
    token = login_response.json()["accessToken"]
    
    # Try to access enrollments (should work for their children)
    response = client.get("/api/enrollments", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200

def test_enrollment_duplicate_prevention(clean_enrollments):
    """Test that duplicate enrollments are prevented"""
    # Login as instructor
    login_response = client.post("/api/auth/login", json={
        "username": "instructor",
        "password": "password12377"
    })
    token = login_response.json()["accessToken"]
    
    # Create first enrollment
    enrollment_data = {
        "studentId": 1,
        "classId": 1,
        "status": "enrolled",
        "enrolledBy": 1,
        "enrollmentDate": "2024-01-01T00:00:00Z"
    }
    response1 = client.post("/api/enrollments", json=enrollment_data, headers={"Authorization": f"Bearer {token}"})
    assert response1.status_code == 200
    
    # Try to create duplicate enrollment
    response2 = client.post("/api/enrollments", json=enrollment_data, headers={"Authorization": f"Bearer {token}"})
    assert response2.status_code == 400
    assert "already enrolled" in response2.json()["detail"]

def test_enrollment_waitlist(clean_enrollments):
    """Test automatic waitlisting when class is full"""
    # Login as instructor
    login_response = client.post("/api/auth/login", json={
        "username": "instructor",
        "password": "password12377"
    })
    token = login_response.json()["accessToken"]
    
    # Create a class with capacity 1
    class_data = {
        "name": "Small Class",
        "description": "Class with limited capacity",
        "instructorId": 1,
        "dojoId": 1,
        "dayOfWeek": "tuesday",
        "startTime": "18:00",
        "endTime": "19:00",
        "maxCapacity": 1,
        "beltLevelRequired": "white"
    }
    class_response = client.post("/api/classes", json=class_data, headers={"Authorization": f"Bearer {token}"})
    class_id = class_response.json()["id"]
    
    # Enroll first student (should be enrolled)
    enrollment1_data = {
        "studentId": 1,
        "classId": class_id,
        "status": "enrolled",
        "enrolledBy": 1,
        "enrollmentDate": "2024-01-01T00:00:00Z"
    }
    response1 = client.post("/api/enrollments", json=enrollment1_data, headers={"Authorization": f"Bearer {token}"})
    assert response1.status_code == 200
    assert response1.json()["status"] == "enrolled"
    
    # Try to enroll second student (should be waitlisted)
    enrollment2_data = {
        "studentId": 2,
        "classId": class_id,
        "status": "enrolled",
        "enrolledBy": 1,
        "enrollmentDate": "2024-01-01T00:00:00Z"
    }
    response2 = client.post("/api/enrollments", json=enrollment2_data, headers={"Authorization": f"Bearer {token}"})
    assert response2.status_code == 200
    assert response2.json()["status"] == "waitlisted"

def test_enrollment_status_transitions(clean_enrollments):
    """Test enrollment status transitions"""
    # Login as instructor
    login_response = client.post("/api/auth/login", json={
        "username": "instructor",
        "password": "password12377"
    })
    token = login_response.json()["accessToken"]
    
    # Create enrollment
    enrollment_data = {
        "studentId": 1,
        "classId": 1,
        "status": "enrolled",
        "enrolledBy": 1,
        "enrollmentDate": "2024-01-01T00:00:00Z"
    }
    create_response = client.post("/api/enrollments", json=enrollment_data, headers={"Authorization": f"Bearer {token}"})
    enrollment_id = create_response.json()["id"]
    
    # Test status transitions
    statuses = ["waitlisted", "suspended", "completed", "dropped"]
    for status in statuses:
        update_data = {"status": status}
        response = client.put(f"/api/enrollments/{enrollment_id}", json=update_data, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        assert response.json()["status"] == status

def test_enrollment_attendance_tracking(clean_enrollments):
    """Test enrollment attendance tracking"""
    # Login as instructor
    login_response = client.post("/api/auth/login", json={
        "username": "instructor",
        "password": "password12377"
    })
    token = login_response.json()["accessToken"]
    
    # Create enrollment
    enrollment_data = {
        "studentId": 1,
        "classId": 1,
        "status": "enrolled",
        "enrolledBy": 1,
        "enrollmentDate": "2024-01-01T00:00:00Z",
        "attendanceCount": 0,
        "totalSessions": 10
    }
    create_response = client.post("/api/enrollments", json=enrollment_data, headers={"Authorization": f"Bearer {token}"})
    enrollment_id = create_response.json()["id"]
    
    # Update attendance
    update_data = {
        "attendanceCount": 5,
        "totalSessions": 10
    }
    response = client.put(f"/api/enrollments/{enrollment_id}", json=update_data, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    enrollment = response.json()
    assert enrollment["attendanceCount"] == 5
    assert enrollment["totalSessions"] == 10

def test_enrollment_notes(clean_enrollments):
    """Test enrollment notes functionality"""
    # Login as instructor
    login_response = client.post("/api/auth/login", json={
        "username": "instructor",
        "password": "password12377"
    })
    token = login_response.json()["accessToken"]
    
    # Create enrollment with notes
    enrollment_data = {
        "studentId": 1,
        "classId": 1,
        "status": "enrolled",
        "enrolledBy": 1,
        "enrollmentDate": "2024-01-01T00:00:00Z",
        "notes": "Initial enrollment note"
    }
    create_response = client.post("/api/enrollments", json=enrollment_data, headers={"Authorization": f"Bearer {token}"})
    enrollment_id = create_response.json()["id"]
    assert create_response.json()["notes"] == "Initial enrollment note"
    
    # Update notes
    update_data = {"notes": "Updated enrollment note"}
    response = client.put(f"/api/enrollments/{enrollment_id}", json=update_data, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["notes"] == "Updated enrollment note" 