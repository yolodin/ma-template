from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, text
from sqlalchemy.sql import func
from typing import AsyncGenerator
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
# Convert to async URL for PostgreSQL
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

# Database Models
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # instructor, parent, student
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    phone = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Dojo(Base):
    __tablename__ = "dojos"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String)
    phone = Column(String)
    email = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    parent_id = Column(Integer, ForeignKey("users.id"))
    dojo_id = Column(Integer, ForeignKey("dojos.id"), nullable=False)
    belt_level = Column(String, nullable=False, default="white")
    age = Column(Integer)
    qr_code = Column(String, unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    dojo_id = Column(Integer, ForeignKey("dojos.id"), nullable=False)
    day_of_week = Column(String, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    max_capacity = Column(Integer, nullable=False, default=20)
    current_enrollment = Column(Integer, nullable=False, default=0)
    belt_level_required = Column(String, default="white")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    booked_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    booked_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    status = Column(String(20), nullable=False, default="enrolled")  # enrolled, waitlisted, dropped, completed, suspended
    enrolled_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    enrollment_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    notes = Column(Text)
    attendance_count = Column(Integer, default=0)
    total_sessions = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    dojo_id = Column(Integer, ForeignKey("dojos.id"), nullable=False)
    check_in_time = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    check_in_method = Column(String(20), default="qr_code", nullable=False)
    notes = Column(Text)
    checked_in_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        
        # Seed initial data if tables are empty
        async with AsyncSessionLocal() as session:
            # Check if we have any users
            result = await session.execute(text("SELECT COUNT(*) FROM users"))
            user_count = result.scalar()
            
            if user_count == 0:
                await seed_data(session)

async def seed_data(session: AsyncSession):
    """Seed initial data for testing"""
    from passlib.context import CryptContext
    from datetime import datetime
    
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    # Create initial dojo
    dojo = Dojo(
        name="YOLO Dojo",
        address="123 Martial Arts Way",
        phone="555-DOJO",
        email="contact@yolodojo.com"
    )
    session.add(dojo)
    await session.flush()  # Get the ID
    
    # Create test users
    instructor = User(
        username="instructor",
        email="instructor@yolodojo.com",
        password=pwd_context.hash("password12377"),
        role="instructor",
        first_name="Master",
        last_name="Kim",
        phone="555-0123"
    )
    session.add(instructor)
    
    parent = User(
        username="parent",
        email="parent@yolodojo.com",
        password=pwd_context.hash("parent12377"),
        role="parent",
        first_name="John",
        last_name="Doe",
        phone="555-0456"
    )
    session.add(parent)
    
    student_user = User(
        username="student1",
        email="student1@yolodojo.com",
        password=pwd_context.hash("student12377"),
        role="student",
        first_name="Alex",
        last_name="Smith",
        phone="555-0789"
    )
    session.add(student_user)
    
    await session.flush()  # Get the IDs
    
    # Create sample classes
    beginner_class = Class(
        name="Beginner Taekwondo",
        description="Introduction to basic Taekwondo techniques and forms",
        instructor_id=instructor.id,
        dojo_id=dojo.id,
        day_of_week="monday",
        start_time="18:00",
        end_time="19:00",
        max_capacity=15,
        belt_level_required="white"
    )
    session.add(beginner_class)
    
    intermediate_class = Class(
        name="Intermediate Taekwondo",
        description="Advanced techniques and sparring for colored belts",
        instructor_id=instructor.id,
        dojo_id=dojo.id,
        day_of_week="wednesday",
        start_time="19:00",
        end_time="20:30",
        max_capacity=12,
        belt_level_required="yellow"
    )
    session.add(intermediate_class)
    
    await session.flush()
    
    # Create sample students
    student1 = Student(
        user_id=None,
        parent_id=parent.id,
        dojo_id=dojo.id,
        belt_level="white",
        age=13,
        qr_code="DOJO:1:STUDENT:1"
    )
    session.add(student1)
    
    student2 = Student(
        user_id=None,
        parent_id=parent.id,
        dojo_id=dojo.id,
        belt_level="yellow",
        age=11,
        qr_code="DOJO:1:STUDENT:2"
    )
    session.add(student2)
    
    await session.commit() 