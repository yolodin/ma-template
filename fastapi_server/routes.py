from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from typing import List
from datetime import datetime, timedelta
import re
import time

from database import get_db, User, Student, Dojo, Class, Booking, Attendance, Enrollment
from models import (
    UserCreate, UserUpdate, User as UserModel,
    StudentCreate, StudentUpdate, Student as StudentModel,
    Dojo as DojoModel, ClassCreate, ClassUpdate, Class as ClassModel,
    BookingCreate, Booking as BookingModel, StudentBookingWithClass,
    EnrollmentCreate, EnrollmentUpdate, Enrollment as EnrollmentModel, EnrollmentWithClassDetails,
    AttendanceCreate, Attendance as AttendanceModel,
    LoginRequest, LoginResponse, QRCodeScanRequest,
    UserRole, CheckInMethod, EnrollmentStatus, HealthResponse
)
from auth import require_auth, require_role, create_access_token, verify_password, get_password_hash

router = APIRouter()

# Health check endpoint
@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse()

# Authentication routes
@router.post("/auth/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    # Find user by username
    result = await db.execute(select(User).where(User.username == login_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(login_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=60 * 24)  # 24 hours
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    # Convert to response model
    user_model = UserModel(
        id=user.id,
        username=user.username,
        email=user.email,
        role=UserRole(user.role),
        firstName=user.first_name,
        lastName=user.last_name,
        phone=user.phone,
        createdAt=user.created_at
    )
    
    return LoginResponse(user=user_model, accessToken=access_token)

@router.get("/auth/me", response_model=UserModel)
async def get_current_user_info(current_user: User = Depends(require_auth)):
    return UserModel(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        role=UserRole(current_user.role),
        firstName=current_user.first_name,
        lastName=current_user.last_name,
        phone=current_user.phone,
        createdAt=current_user.created_at
    )

# User management routes
@router.get("/users", response_model=List[UserModel])
async def get_all_users(
    current_user: User = Depends(require_role([UserRole.INSTRUCTOR])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User))
    users = result.scalars().all()
    
    return [
        UserModel(
            id=user.id,
            username=user.username,
            email=user.email,
            role=UserRole(user.role),
            firstName=user.first_name,
            lastName=user.last_name,
            phone=user.phone,
            createdAt=user.created_at
        )
        for user in users
    ]

@router.get("/users/{user_id}", response_model=UserModel)
async def get_user(
    user_id: int,
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db)
):
    # Only instructors can view any user, others can only view themselves
    if current_user.id != user_id and current_user.role != "instructor":
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserModel(
        id=user.id,
        username=user.username,
        email=user.email,
        role=UserRole(user.role),
        firstName=user.first_name,
        lastName=user.last_name,
        phone=user.phone,
        createdAt=user.created_at
    )

@router.post("/users", response_model=UserModel)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(require_role([UserRole.INSTRUCTOR])),
    db: AsyncSession = Depends(get_db)
):
    # Check if username already exists
    result = await db.execute(select(User).where(User.username == user_data.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user
    user = User(
        username=user_data.username,
        email=user_data.email,
        password=hashed_password,
        role=user_data.role.value,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return UserModel(
        id=user.id,
        username=user.username,
        email=user.email,
        role=UserRole(user.role),
        firstName=user.first_name,
        lastName=user.last_name,
        phone=user.phone,
        createdAt=user.created_at
    )

@router.put("/users/{user_id}", response_model=UserModel)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db)
):
    # Only instructors can update any user, others can only update themselves
    if current_user.id != user_id and current_user.role != "instructor":
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields
    update_data = {}
    if user_data.username is not None:
        update_data["username"] = user_data.username
    if user_data.email is not None:
        update_data["email"] = user_data.email
    if user_data.password is not None:
        update_data["password"] = get_password_hash(user_data.password)
    if user_data.role is not None:
        update_data["role"] = user_data.role.value
    if user_data.first_name is not None:
        update_data["first_name"] = user_data.first_name
    if user_data.last_name is not None:
        update_data["last_name"] = user_data.last_name
    if user_data.phone is not None:
        update_data["phone"] = user_data.phone
    
    await db.execute(
        update(User).where(User.id == user_id).values(**update_data)
    )
    await db.commit()
    
    # Get updated user
    result = await db.execute(select(User).where(User.id == user_id))
    updated_user = result.scalar_one()
    
    return UserModel(
        id=updated_user.id,
        username=updated_user.username,
        email=updated_user.email,
        role=UserRole(updated_user.role),
        firstName=updated_user.first_name,
        lastName=updated_user.last_name,
        phone=updated_user.phone,
        createdAt=updated_user.created_at
    )

# Student management routes
@router.get("/students", response_model=List[StudentModel])
async def get_students(
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role == "instructor":
        # Instructors can see all students
        result = await db.execute(select(Student))
        students = result.scalars().all()
    elif current_user.role == "parent":
        # Parents can only see their own children
        result = await db.execute(
            select(Student).where(Student.parent_id == current_user.id)
        )
        students = result.scalars().all()
    else:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return [
        StudentModel(
            id=student.id,
            userId=student.user_id,
            parentId=student.parent_id,
            dojoId=student.dojo_id,
            beltLevel=student.belt_level,
            age=student.age,
            qrCode=student.qr_code,
            isActive=student.is_active,
            createdAt=student.created_at
        )
        for student in students
    ]

@router.get("/students/{student_id}", response_model=StudentModel)
async def get_student(
    student_id: int,
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Student).where(Student.id == student_id))
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check permissions
    if (current_user.role == "instructor" or 
        (current_user.role == "parent" and student.parent_id == current_user.id) or
        (current_user.role == "student" and student.user_id == current_user.id)):
        return StudentModel(
            id=student.id,
            userId=student.user_id,
            parentId=student.parent_id,
            dojoId=student.dojo_id,
            beltLevel=student.belt_level,
            age=student.age,
            qrCode=student.qr_code,
            isActive=student.is_active,
            createdAt=student.created_at
        )
    else:
        raise HTTPException(status_code=403, detail="Access denied")

@router.post("/students", response_model=StudentModel)
async def create_student(
    student_data: StudentCreate,
    current_user: User = Depends(require_role([UserRole.INSTRUCTOR, UserRole.PARENT])),
    db: AsyncSession = Depends(get_db)
):
    # If parent is creating student, set parent_id to their own ID
    if current_user.role == "parent":
        student_data.parent_id = current_user.id
    
    # Generate unique QR code using timestamp
    timestamp = int(time.time())
    qr_code = f"DOJO:1:STUDENT:{timestamp}"
    
    student = Student(
        user_id=student_data.user_id,
        parent_id=student_data.parent_id,
        dojo_id=student_data.dojo_id,
        belt_level=student_data.belt_level,
        age=student_data.age,
        qr_code=qr_code
    )
    
    db.add(student)
    await db.commit()
    await db.refresh(student)
    
    return StudentModel(
        id=student.id,
        userId=student.user_id,
        parentId=student.parent_id,
        dojoId=student.dojo_id,
        beltLevel=student.belt_level,
        age=student.age,
        qrCode=student.qr_code,
        isActive=student.is_active,
        createdAt=student.created_at
    )

@router.put("/students/{student_id}", response_model=StudentModel)
async def update_student(
    student_id: int,
    student_data: StudentUpdate,
    current_user: User = Depends(require_role([UserRole.INSTRUCTOR, UserRole.PARENT])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Student).where(Student.id == student_id))
    existing_student = result.scalar_one_or_none()
    
    if not existing_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check permissions
    if current_user.role == "parent" and existing_student.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Update fields
    update_data = {}
    if student_data.user_id is not None:
        update_data["user_id"] = student_data.user_id
    if student_data.parent_id is not None:
        update_data["parent_id"] = student_data.parent_id
    if student_data.dojo_id is not None:
        update_data["dojo_id"] = student_data.dojo_id
    if student_data.belt_level is not None:
        update_data["belt_level"] = student_data.belt_level
    if student_data.age is not None:
        update_data["age"] = student_data.age
    
    await db.execute(
        update(Student).where(Student.id == student_id).values(**update_data)
    )
    await db.commit()
    
    # Get updated student
    result = await db.execute(select(Student).where(Student.id == student_id))
    updated_student = result.scalar_one()
    
    return StudentModel(
        id=updated_student.id,
        userId=updated_student.user_id,
        parentId=updated_student.parent_id,
        dojoId=updated_student.dojo_id,
        beltLevel=updated_student.belt_level,
        age=updated_student.age,
        qrCode=updated_student.qr_code,
        isActive=updated_student.is_active,
        createdAt=updated_student.created_at
    )

@router.delete("/students/{student_id}")
async def delete_student(
    student_id: int,
    current_user: User = Depends(require_role([UserRole.INSTRUCTOR, UserRole.PARENT])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Student).where(Student.id == student_id))
    existing_student = result.scalar_one_or_none()
    
    if not existing_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check permissions - parents can only delete their own children
    if current_user.role == "parent" and existing_student.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check for related data that might prevent deletion
    # Check for active bookings
    result = await db.execute(
        select(Booking).where(
            Booking.student_id == student_id,
            Booking.is_active == True
        )
    )
    active_bookings = result.scalars().all()
    
    if active_bookings:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete student with {len(active_bookings)} active bookings. Please cancel bookings first."
        )
    
    # Check for attendance records
    result = await db.execute(
        select(Attendance).where(Attendance.student_id == student_id)
    )
    attendance_records = result.scalars().all()
    
    if attendance_records:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete student with {len(attendance_records)} attendance records. Attendance history must be preserved."
        )
    
    # Delete the student
    await db.execute(delete(Student).where(Student.id == student_id))
    await db.commit()
    
    return {"message": "Student deleted successfully"}

# Dojo routes
@router.get("/dojos", response_model=List[DojoModel])
async def get_dojos(
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Dojo))
    dojos = result.scalars().all()
    
    return [
        DojoModel(
            id=dojo.id,
            name=dojo.name,
            address=dojo.address,
            phone=dojo.phone,
            email=dojo.email,
            createdAt=dojo.created_at
        )
        for dojo in dojos
    ]

@router.get("/dojos/{dojo_id}", response_model=DojoModel)
async def get_dojo(
    dojo_id: int,
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Dojo).where(Dojo.id == dojo_id))
    dojo = result.scalar_one_or_none()
    
    if not dojo:
        raise HTTPException(status_code=404, detail="Dojo not found")
    
    return DojoModel(
        id=dojo.id,
        name=dojo.name,
        address=dojo.address,
        phone=dojo.phone,
        email=dojo.email,
        createdAt=dojo.created_at
    )

# Class management routes
@router.get("/classes", response_model=List[ClassModel])
async def get_classes(
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role == "instructor":
        # Instructors can see all classes
        result = await db.execute(select(Class))
        classes = result.scalars().all()
    elif current_user.role == "parent":
        # Parents can see classes at their children's dojo
        result = await db.execute(
            select(Class).distinct().join(Student, Class.dojo_id == Student.dojo_id)
            .where(Student.parent_id == current_user.id)
        )
        classes = result.scalars().all()
    else:
        # Students can only see classes they are enrolled in
        result = await db.execute(
            select(Class).join(Enrollment, Class.id == Enrollment.class_id)
            .join(Student, Enrollment.student_id == Student.id)
            .where(Student.user_id == current_user.id)
            .where(Enrollment.status == "enrolled")
        )
        classes = result.scalars().all()
    
    return [
        ClassModel(
            id=cls.id,
            name=cls.name,
            description=cls.description,
            instructorId=cls.instructor_id,
            dojoId=cls.dojo_id,
            dayOfWeek=cls.day_of_week,
            startTime=cls.start_time,
            endTime=cls.end_time,
            maxCapacity=cls.max_capacity,
            currentEnrollment=cls.current_enrollment,
            beltLevelRequired=cls.belt_level_required,
            isActive=cls.is_active,
            createdAt=cls.created_at
        )
        for cls in classes
    ]

@router.get("/classes/{class_id}", response_model=ClassModel)
async def get_class(
    class_id: int,
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Class).where(Class.id == class_id))
    cls = result.scalar_one_or_none()
    
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    return ClassModel(
        id=cls.id,
        name=cls.name,
        description=cls.description,
        instructorId=cls.instructor_id,
        dojoId=cls.dojo_id,
        dayOfWeek=cls.day_of_week,
        startTime=cls.start_time,
        endTime=cls.end_time,
        maxCapacity=cls.max_capacity,
        currentEnrollment=cls.current_enrollment,
        beltLevelRequired=cls.belt_level_required,
        isActive=cls.is_active,
        createdAt=cls.created_at
    )

@router.post("/classes", response_model=ClassModel)
async def create_class(
    class_data: ClassCreate,
    current_user: User = Depends(require_role([UserRole.INSTRUCTOR])),
    db: AsyncSession = Depends(get_db)
):
    cls = Class(
        name=class_data.name,
        description=class_data.description,
        instructor_id=class_data.instructor_id,
        dojo_id=class_data.dojo_id,
        day_of_week=class_data.day_of_week.value,
        start_time=class_data.start_time,
        end_time=class_data.end_time,
        max_capacity=class_data.max_capacity,
        belt_level_required=class_data.belt_level_required
    )
    
    db.add(cls)
    await db.commit()
    await db.refresh(cls)
    
    return ClassModel(
        id=cls.id,
        name=cls.name,
        description=cls.description,
        instructorId=cls.instructor_id,
        dojoId=cls.dojo_id,
        dayOfWeek=cls.day_of_week,
        startTime=cls.start_time,
        endTime=cls.end_time,
        maxCapacity=cls.max_capacity,
        currentEnrollment=cls.current_enrollment,
        beltLevelRequired=cls.belt_level_required,
        isActive=cls.is_active,
        createdAt=cls.created_at
    )

@router.put("/classes/{class_id}", response_model=ClassModel)
async def update_class(
    class_id: int,
    class_data: ClassUpdate,
    current_user: User = Depends(require_role([UserRole.INSTRUCTOR])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Class).where(Class.id == class_id))
    existing_class = result.scalar_one_or_none()
    
    if not existing_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Update fields
    update_data = {}
    if class_data.name is not None:
        update_data["name"] = class_data.name
    if class_data.description is not None:
        update_data["description"] = class_data.description
    if class_data.instructor_id is not None:
        update_data["instructor_id"] = class_data.instructor_id
    if class_data.dojo_id is not None:
        update_data["dojo_id"] = class_data.dojo_id
    if class_data.day_of_week is not None:
        update_data["day_of_week"] = class_data.day_of_week.value
    if class_data.start_time is not None:
        update_data["start_time"] = class_data.start_time
    if class_data.end_time is not None:
        update_data["end_time"] = class_data.end_time
    if class_data.max_capacity is not None:
        update_data["max_capacity"] = class_data.max_capacity
    if class_data.belt_level_required is not None:
        update_data["belt_level_required"] = class_data.belt_level_required
    if class_data.is_active is not None:
        update_data["is_active"] = class_data.is_active
    
    await db.execute(
        update(Class).where(Class.id == class_id).values(**update_data)
    )
    await db.commit()
    
    # Get updated class
    result = await db.execute(select(Class).where(Class.id == class_id))
    updated_class = result.scalar_one()
    
    return ClassModel(
        id=updated_class.id,
        name=updated_class.name,
        description=updated_class.description,
        instructorId=updated_class.instructor_id,
        dojoId=updated_class.dojo_id,
        dayOfWeek=updated_class.day_of_week,
        startTime=updated_class.start_time,
        endTime=updated_class.end_time,
        maxCapacity=updated_class.max_capacity,
        currentEnrollment=updated_class.current_enrollment,
        beltLevelRequired=updated_class.belt_level_required,
        isActive=updated_class.is_active,
        createdAt=updated_class.created_at
    )

@router.delete("/classes/{class_id}")
async def delete_class(
    class_id: int,
    current_user: User = Depends(require_role([UserRole.INSTRUCTOR])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Class).where(Class.id == class_id))
    existing_class = result.scalar_one_or_none()
    
    if not existing_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    await db.execute(delete(Class).where(Class.id == class_id))
    await db.commit()
    
    return {"message": "Class deleted successfully"}

# Booking routes
@router.get("/bookings", response_model=List[BookingModel])
async def get_bookings(
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role == "instructor":
        # Instructors can see all bookings
        result = await db.execute(select(Booking))
        bookings = result.scalars().all()
    elif current_user.role == "parent":
        # Parents can see bookings for their children
        result = await db.execute(
            select(Booking).join(Student, Booking.student_id == Student.id)
            .where(Student.parent_id == current_user.id)
        )
        bookings = result.scalars().all()
    else:
        # Students can see their own bookings
        result = await db.execute(
            select(Booking).join(Student, Booking.student_id == Student.id)
            .where(Student.user_id == current_user.id)
        )
        bookings = result.scalars().all()
    
    return [
        BookingModel(
            id=booking.id,
            studentId=booking.student_id,
            classId=booking.class_id,
            bookedBy=booking.booked_by,
            bookedAt=booking.booked_at,
            isActive=booking.is_active,
            createdAt=booking.created_at
        )
        for booking in bookings
    ]

@router.post("/bookings", response_model=BookingModel)
async def create_booking(
    booking_data: BookingCreate,
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db)
):
    # Check if student exists and user has permission
    result = await db.execute(select(Student).where(Student.id == booking_data.studentId))
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    if (current_user.role == "parent" and student.parent_id != current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if class exists
    result = await db.execute(select(Class).where(Class.id == booking_data.classId))
    cls = result.scalar_one_or_none()
    
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check if already booked
    result = await db.execute(
        select(Booking).where(
            Booking.student_id == booking_data.studentId,
            Booking.class_id == booking_data.classId,
            Booking.is_active == True
        )
    )
    existing_booking = result.scalar_one_or_none()
    
    if existing_booking:
        raise HTTPException(status_code=400, detail="Student already booked for this class")
    
    # Check class capacity
    if cls.current_enrollment >= cls.max_capacity:
        raise HTTPException(status_code=400, detail="Class is at maximum capacity")
    
    # Create booking
    booking = Booking(
        student_id=booking_data.studentId,
        class_id=booking_data.classId,
        booked_by=booking_data.bookedBy
    )
    
    db.add(booking)
    
    # Update class enrollment
    await db.execute(
        update(Class).where(Class.id == cls.id)
        .values(current_enrollment=cls.current_enrollment + 1)
    )
    
    await db.commit()
    await db.refresh(booking)
    
    return BookingModel(
        id=booking.id,
        studentId=booking.student_id,
        classId=booking.class_id,
        bookedBy=booking.booked_by,
        bookedAt=booking.booked_at,
        isActive=booking.is_active,
        createdAt=booking.created_at
    )

@router.delete("/bookings/{booking_id}")
async def delete_booking(
    booking_id: int,
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check permissions
    result = await db.execute(select(Student).where(Student.id == booking.student_id))
    student = result.scalar_one_or_none()
    
    if (current_user.role == "parent" and student.parent_id != current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Soft delete booking
    await db.execute(
        update(Booking).where(Booking.id == booking_id).values(is_active=False)
    )
    
    # Update class enrollment
    result = await db.execute(select(Class).where(Class.id == booking.class_id))
    cls = result.scalar_one()
    
    await db.execute(
        update(Class).where(Class.id == cls.id)
        .values(current_enrollment=max(0, cls.current_enrollment - 1))
    )
    
    await db.commit()
    
    return {"message": "Booking cancelled successfully"}

# Attendance routes
@router.get("/attendance", response_model=List[AttendanceModel])
async def get_attendance(
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role == "instructor":
        # Instructors can see all attendance
        result = await db.execute(select(Attendance))
        attendance_records = result.scalars().all()
    elif current_user.role == "parent":
        # Parents can see attendance for their children
        result = await db.execute(
            select(Attendance).join(Student, Attendance.student_id == Student.id)
            .where(Student.parent_id == current_user.id)
        )
        attendance_records = result.scalars().all()
    else:
        # Students can see their own attendance
        result = await db.execute(
            select(Attendance).join(Student, Attendance.student_id == Student.id)
            .where(Student.user_id == current_user.id)
        )
        attendance_records = result.scalars().all()
    
    return [
        AttendanceModel(
            id=record.id,
            studentId=record.student_id,
            classId=record.class_id,
            dojoId=record.dojo_id,
            checkInTime=record.check_in_time,
            checkInMethod=CheckInMethod(record.check_in_method),
            notes=record.notes,
            checkedInBy=record.checked_in_by,
            createdAt=record.created_at
        )
        for record in attendance_records
    ]

@router.get("/students/{student_id}/attendance", response_model=List[AttendanceModel])
async def get_student_attendance(
    student_id: int,
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db)
):
    # Check if student exists
    result = await db.execute(select(Student).where(Student.id == student_id))
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get attendance records for this student
    result = await db.execute(
        select(Attendance).where(Attendance.student_id == student_id)
        .order_by(Attendance.check_in_time.desc())
    )
    attendance_records = result.scalars().all()
    
    return [
        AttendanceModel(
            id=record.id,
            studentId=record.student_id,
            classId=record.class_id,
            dojoId=record.dojo_id,
            checkInTime=record.check_in_time,
            checkInMethod=CheckInMethod(record.check_in_method),
            notes=record.notes,
            checkedInBy=record.checked_in_by,
            createdAt=record.created_at
        )
        for record in attendance_records
    ]

@router.post("/attendance/qr-scan", response_model=AttendanceModel)
async def qr_code_scan(
    qr_data: QRCodeScanRequest,
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db)
):
    # Find student by QR code
    result = await db.execute(select(Student).where(Student.qr_code == qr_data.qrCode))
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found with this QR code")
    
    # Check if class exists
    result = await db.execute(select(Class).where(Class.id == qr_data.classId))
    class_info = result.scalar_one_or_none()
    
    if not class_info:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check if student is already checked in for this class today
    today = datetime.now().date()
    result = await db.execute(
        select(Attendance).where(
            Attendance.student_id == student.id,
            Attendance.class_id == qr_data.classId,
            Attendance.check_in_time >= today
        )
    )
    existing_attendance = result.scalar_one_or_none()
    
    if existing_attendance:
        raise HTTPException(status_code=400, detail="Student already checked in for this class today")
    
    # Create attendance record
    attendance = Attendance(
        student_id=student.id,
        class_id=qr_data.classId,
        dojo_id=student.dojo_id,
        check_in_time=datetime.now(),
        check_in_method="qr_code",
        checked_in_by=current_user.id
    )
    
    db.add(attendance)
    await db.commit()
    await db.refresh(attendance)
    
    return AttendanceModel(
        id=attendance.id,
        studentId=attendance.student_id,
        classId=attendance.class_id,
        dojoId=attendance.dojo_id,
        checkInTime=attendance.check_in_time,
        checkInMethod=CheckInMethod(attendance.check_in_method),
        notes=attendance.notes,
        checkedInBy=attendance.checked_in_by,
        createdAt=attendance.created_at
    )

@router.post("/attendance/manual", response_model=AttendanceModel)
async def manual_checkin(
    attendance_data: AttendanceCreate,
    current_user: User = Depends(require_role([UserRole.INSTRUCTOR])),
    db: AsyncSession = Depends(get_db)
):
    # Check if student exists
    result = await db.execute(select(Student).where(Student.id == attendance_data.studentId))
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if class exists
    result = await db.execute(select(Class).where(Class.id == attendance_data.classId))
    cls = result.scalar_one_or_none()
    
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check for duplicate attendance on the same day
    today = datetime.now().date()
    result = await db.execute(
        select(Attendance).where(
            Attendance.student_id == attendance_data.studentId,
            Attendance.class_id == attendance_data.classId,
            Attendance.check_in_time >= today
        )
    )
    existing_attendance = result.scalar_one_or_none()
    
    if existing_attendance:
        raise HTTPException(status_code=400, detail="Student already checked in for this class today")
    
    # Create attendance record
    attendance = Attendance(
        student_id=attendance_data.studentId,
        class_id=attendance_data.classId,
        dojo_id=attendance_data.dojoId,
        check_in_method="manual",
        notes=attendance_data.notes,
        checked_in_by=current_user.id
    )
    
    db.add(attendance)
    await db.commit()
    await db.refresh(attendance)
    
    return AttendanceModel(
        id=attendance.id,
        studentId=attendance.student_id,
        classId=attendance.class_id,
        dojoId=attendance.dojo_id,
        checkInTime=attendance.check_in_time,
        checkInMethod=CheckInMethod(attendance.check_in_method),
        notes=attendance.notes,
        checkedInBy=attendance.checked_in_by,
        createdAt=attendance.created_at
    )

@router.delete("/bookings/{class_id}/{student_id}")
async def delete_booking_by_class_and_student(
    class_id: int,
    student_id: int,
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db)
):
    # Find the booking
    result = await db.execute(
        select(Booking).where(
            Booking.class_id == class_id,
            Booking.student_id == student_id
        )
    )
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check permissions - only instructors or the student's parent can delete bookings
    if current_user.role != "instructor":
        # Check if current user is the parent of the student
        result = await db.execute(
            select(Student).where(
                Student.id == student_id,
                Student.parent_id == current_user.id
            )
        )
        student = result.scalar_one_or_none()
        if not student:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Delete the booking
    await db.execute(delete(Booking).where(Booking.id == booking.id))
    await db.commit()
    
    return {"message": "Booking deleted successfully"}

@router.get("/students/{student_id}/bookings", response_model=List[StudentBookingWithClass])
async def get_student_bookings(
    student_id: int,
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db)
):
    # Check if student exists
    result = await db.execute(select(Student).where(Student.id == student_id))
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check permissions
    if current_user.role == "parent" and student.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role == "student" and student.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get bookings with class details for this student
    result = await db.execute(
        select(Booking, Class).join(Class, Booking.class_id == Class.id)
        .where(
            Booking.student_id == student_id,
            Booking.is_active == True
        ).order_by(Booking.created_at.desc())
    )
    booking_class_pairs = result.all()
    
    return [
        StudentBookingWithClass(
            id=booking.id,
            student_id=booking.student_id,
            class_id=booking.class_id,
            booked_at=booking.booked_at,
            is_active=booking.is_active,
            created_at=booking.created_at,
            class_name=cls.name,
            class_description=cls.description,
            day_of_week=cls.day_of_week,
            start_time=cls.start_time,
            end_time=cls.end_time,
            belt_level_required=cls.belt_level_required
        )
        for booking, cls in booking_class_pairs
    ]

# Enrollment routes
@router.get("/enrollments", response_model=List[EnrollmentWithClassDetails])
async def get_enrollments(
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role == "instructor":
        # Instructors can see all enrollments
        result = await db.execute(
            select(Enrollment, Class, User, Dojo)
            .join(Class, Enrollment.class_id == Class.id)
            .join(User, Class.instructor_id == User.id)
            .join(Dojo, Class.dojo_id == Dojo.id)
            .order_by(Enrollment.created_at.desc())
        )
        enrollment_data = result.all()
    elif current_user.role == "parent":
        # Parents can see enrollments for their children
        result = await db.execute(
            select(Enrollment, Class, User, Dojo)
            .join(Class, Enrollment.class_id == Class.id)
            .join(User, Class.instructor_id == User.id)
            .join(Dojo, Class.dojo_id == Dojo.id)
            .join(Student, Enrollment.student_id == Student.id)
            .where(Student.parent_id == current_user.id)
            .order_by(Enrollment.created_at.desc())
        )
        enrollment_data = result.all()
    else:
        # Students can see their own enrollments
        result = await db.execute(
            select(Enrollment, Class, User, Dojo)
            .join(Class, Enrollment.class_id == Class.id)
            .join(User, Class.instructor_id == User.id)
            .join(Dojo, Class.dojo_id == Dojo.id)
            .join(Student, Enrollment.student_id == Student.id)
            .where(Student.user_id == current_user.id)
            .order_by(Enrollment.created_at.desc())
        )
        enrollment_data = result.all()
    
    return [
        EnrollmentWithClassDetails(
            id=enrollment.id,
            studentId=enrollment.student_id,
            classId=enrollment.class_id,
            status=EnrollmentStatus(enrollment.status),
            enrolledBy=enrollment.enrolled_by,
            enrollmentDate=enrollment.enrollment_date,
            startDate=enrollment.start_date,
            endDate=enrollment.end_date,
            notes=enrollment.notes,
            attendanceCount=enrollment.attendance_count,
            totalSessions=enrollment.total_sessions,
            createdAt=enrollment.created_at,
            updatedAt=enrollment.updated_at,
            className=cls.name,
            classDescription=cls.description,
            dayOfWeek=cls.day_of_week,
            startTime=cls.start_time,
            endTime=cls.end_time,
            beltLevelRequired=cls.belt_level_required,
            instructorName=f"{instructor.first_name} {instructor.last_name}",
            dojoName=dojo.name
        )
        for enrollment, cls, instructor, dojo in enrollment_data
    ]

@router.get("/students/{student_id}/enrollments", response_model=List[EnrollmentWithClassDetails])
async def get_student_enrollments(
    student_id: int,
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db)
):
    # Check if student exists
    result = await db.execute(select(Student).where(Student.id == student_id))
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check permissions
    if current_user.role == "parent" and student.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role == "student" and student.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get enrollments for this student
    result = await db.execute(
        select(Enrollment, Class, User, Dojo)
        .join(Class, Enrollment.class_id == Class.id)
        .join(User, Class.instructor_id == User.id)
        .join(Dojo, Class.dojo_id == Dojo.id)
        .where(Enrollment.student_id == student_id)
        .order_by(Enrollment.created_at.desc())
    )
    enrollment_data = result.all()
    
    return [
        EnrollmentWithClassDetails(
            id=enrollment.id,
            studentId=enrollment.student_id,
            classId=enrollment.class_id,
            status=EnrollmentStatus(enrollment.status),
            enrolledBy=enrollment.enrolled_by,
            enrollmentDate=enrollment.enrollment_date,
            startDate=enrollment.start_date,
            endDate=enrollment.end_date,
            notes=enrollment.notes,
            attendanceCount=enrollment.attendance_count,
            totalSessions=enrollment.total_sessions,
            createdAt=enrollment.created_at,
            updatedAt=enrollment.updated_at,
            className=cls.name,
            classDescription=cls.description,
            dayOfWeek=cls.day_of_week,
            startTime=cls.start_time,
            endTime=cls.end_time,
            beltLevelRequired=cls.belt_level_required,
            instructorName=f"{instructor.first_name} {instructor.last_name}",
            dojoName=dojo.name
        )
        for enrollment, cls, instructor, dojo in enrollment_data
    ]

@router.post("/enrollments", response_model=EnrollmentModel)
async def create_enrollment(
    enrollment_data: EnrollmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_auth)
):
    """Create a new enrollment"""
    # Check if student exists
    result = await db.execute(select(Student).where(Student.id == enrollment_data.student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if class exists
    result = await db.execute(select(Class).where(Class.id == enrollment_data.class_id))
    class_obj = result.scalar_one_or_none()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check if enrollment already exists
    result = await db.execute(
        select(Enrollment).where(
            Enrollment.student_id == enrollment_data.student_id,
            Enrollment.class_id == enrollment_data.class_id,
            Enrollment.status.in_(["enrolled", "waitlisted"])
        )
    )
    existing_enrollment = result.scalar_one_or_none()
    if existing_enrollment:
        raise HTTPException(status_code=400, detail="Student is already enrolled in this class")
    
    # Check class capacity and set status
    if enrollment_data.status == EnrollmentStatus.ENROLLED:
        result = await db.execute(
            select(Enrollment).where(
                Enrollment.class_id == enrollment_data.class_id,
                Enrollment.status == EnrollmentStatus.ENROLLED
            )
        )
        enrolled_count = len(result.scalars().all())
        if enrolled_count >= class_obj.max_capacity:
            enrollment_data.status = EnrollmentStatus.WAITLISTED
    
    # Create enrollment
    enrollment = Enrollment(
        student_id=enrollment_data.student_id,
        class_id=enrollment_data.class_id,
        status=enrollment_data.status,
        enrolled_by=enrollment_data.enrolled_by,
        enrollment_date=enrollment_data.enrollment_date,
        start_date=enrollment_data.start_date,
        end_date=enrollment_data.end_date,
        notes=enrollment_data.notes,
        attendance_count=enrollment_data.attendance_count,
        total_sessions=enrollment_data.total_sessions
    )
    
    db.add(enrollment)
    
    # Update class enrollment count if status is enrolled
    if enrollment_data.status == EnrollmentStatus.ENROLLED:
        await db.execute(
            update(Class).where(Class.id == class_obj.id)
            .values(current_enrollment=class_obj.current_enrollment + 1)
        )
    
    await db.commit()
    await db.refresh(enrollment)
    
    return enrollment

@router.put("/enrollments/{enrollment_id}", response_model=EnrollmentModel)
async def update_enrollment(
    enrollment_id: int,
    enrollment_data: EnrollmentUpdate,
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Enrollment).where(Enrollment.id == enrollment_id))
    enrollment = result.scalar_one_or_none()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    # Check permissions
    result = await db.execute(select(Student).where(Student.id == enrollment.student_id))
    student = result.scalar_one_or_none()
    
    if (current_user.role == "parent" and student.parent_id != current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Track status change for class occupancy updates
    old_status = enrollment.status
    new_status = enrollment_data.status.value if enrollment_data.status is not None else old_status
    
    # Update fields
    update_data = {}
    if enrollment_data.status is not None:
        update_data["status"] = enrollment_data.status.value
    if enrollment_data.start_date is not None:
        update_data["start_date"] = enrollment_data.start_date
    if enrollment_data.end_date is not None:
        update_data["end_date"] = enrollment_data.end_date
    if enrollment_data.notes is not None:
        update_data["notes"] = enrollment_data.notes
    if enrollment_data.attendance_count is not None:
        update_data["attendance_count"] = enrollment_data.attendance_count
    if enrollment_data.total_sessions is not None:
        update_data["total_sessions"] = enrollment_data.total_sessions
    
    await db.execute(
        update(Enrollment).where(Enrollment.id == enrollment_id).values(**update_data)
    )
    
    # Update class enrollment count if status changed
    if old_status != new_status:
        result = await db.execute(select(Class).where(Class.id == enrollment.class_id))
        cls = result.scalar_one()
        
        if old_status == "enrolled" and new_status != "enrolled":
            # Student was enrolled, now not enrolled - decrease count
            await db.execute(
                update(Class).where(Class.id == cls.id)
                .values(current_enrollment=max(0, cls.current_enrollment - 1))
            )
        elif old_status != "enrolled" and new_status == "enrolled":
            # Student was not enrolled, now enrolled - increase count
            await db.execute(
                update(Class).where(Class.id == cls.id)
                .values(current_enrollment=cls.current_enrollment + 1)
            )
    
    await db.commit()
    
    # Get updated enrollment
    result = await db.execute(select(Enrollment).where(Enrollment.id == enrollment_id))
    updated_enrollment = result.scalar_one()
    
    return EnrollmentModel(
        id=updated_enrollment.id,
        studentId=updated_enrollment.student_id,
        classId=updated_enrollment.class_id,
        status=EnrollmentStatus(updated_enrollment.status),
        enrolledBy=updated_enrollment.enrolled_by,
        enrollmentDate=updated_enrollment.enrollment_date,
        startDate=updated_enrollment.start_date,
        endDate=updated_enrollment.end_date,
        notes=updated_enrollment.notes,
        attendanceCount=updated_enrollment.attendance_count,
        totalSessions=updated_enrollment.total_sessions,
        createdAt=updated_enrollment.created_at,
        updatedAt=updated_enrollment.updated_at
    )

@router.delete("/enrollments/{enrollment_id}")
async def delete_enrollment(
    enrollment_id: int,
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Enrollment).where(Enrollment.id == enrollment_id))
    enrollment = result.scalar_one_or_none()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    # Check permissions
    result = await db.execute(select(Student).where(Student.id == enrollment.student_id))
    student = result.scalar_one_or_none()
    
    if (current_user.role == "parent" and student.parent_id != current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Update class enrollment count if status was enrolled
    if enrollment.status == "enrolled":
        result = await db.execute(select(Class).where(Class.id == enrollment.class_id))
        cls = result.scalar_one()
        
        await db.execute(
            update(Class).where(Class.id == cls.id)
            .values(current_enrollment=max(0, cls.current_enrollment - 1))
        )
    
    # Delete enrollment
    await db.execute(delete(Enrollment).where(Enrollment.id == enrollment_id))
    await db.commit()
    
    return {"message": "Enrollment deleted successfully"} 