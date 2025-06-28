from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums
class UserRole(str, Enum):
    INSTRUCTOR = "instructor"
    PARENT = "parent"
    STUDENT = "student"

class CheckInMethod(str, Enum):
    QR_CODE = "qr_code"
    MANUAL = "manual"

class DayOfWeek(str, Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"

# Base Models
class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    role: UserRole
    first_name: str = Field(..., alias="firstName")
    last_name: str = Field(..., alias="lastName")
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    first_name: Optional[str] = Field(None, alias="firstName")
    last_name: Optional[str] = Field(None, alias="lastName")
    phone: Optional[str] = None

class User(UserBase):
    id: int
    created_at: datetime = Field(..., alias="createdAt")

    class Config:
        from_attributes = True
        populate_by_name = True

class DojoBase(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class DojoCreate(DojoBase):
    pass

class Dojo(DojoBase):
    id: int
    created_at: datetime = Field(..., alias="createdAt")

    class Config:
        from_attributes = True
        populate_by_name = True

class StudentBase(BaseModel):
    user_id: Optional[int] = Field(None, alias="userId")
    parent_id: Optional[int] = Field(None, alias="parentId")
    dojo_id: int = Field(..., alias="dojoId")
    belt_level: str = Field("white", alias="beltLevel")
    age: Optional[int] = None

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    user_id: Optional[int] = Field(None, alias="userId")
    parent_id: Optional[int] = Field(None, alias="parentId")
    dojo_id: Optional[int] = Field(None, alias="dojoId")
    belt_level: Optional[str] = Field(None, alias="beltLevel")
    age: Optional[int] = None

class Student(StudentBase):
    id: int
    qr_code: str = Field(..., alias="qrCode")
    is_active: bool = Field(True, alias="isActive")
    created_at: datetime = Field(..., alias="createdAt")

    class Config:
        from_attributes = True
        populate_by_name = True

class ClassBase(BaseModel):
    name: str
    description: Optional[str] = None
    instructor_id: int = Field(..., alias="instructorId")
    dojo_id: int = Field(..., alias="dojoId")
    day_of_week: DayOfWeek = Field(..., alias="dayOfWeek")
    start_time: str = Field(..., alias="startTime")
    end_time: str = Field(..., alias="endTime")
    max_capacity: int = Field(20, alias="maxCapacity")
    belt_level_required: str = Field("white", alias="beltLevelRequired")

    @validator('start_time', 'end_time')
    def validate_time_format(cls, v):
        import re
        if not re.match(r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$', v):
            raise ValueError('Time must be in HH:MM format')
        return v

class ClassCreate(ClassBase):
    pass

class ClassUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    instructor_id: Optional[int] = Field(None, alias="instructorId")
    dojo_id: Optional[int] = Field(None, alias="dojoId")
    day_of_week: Optional[DayOfWeek] = Field(None, alias="dayOfWeek")
    start_time: Optional[str] = Field(None, alias="startTime")
    end_time: Optional[str] = Field(None, alias="endTime")
    max_capacity: Optional[int] = Field(None, alias="maxCapacity")
    belt_level_required: Optional[str] = Field(None, alias="beltLevelRequired")
    is_active: Optional[bool] = Field(None, alias="isActive")

    @validator('start_time', 'end_time')
    def validate_time_format(cls, v):
        if v is None:
            return v
        import re
        if not re.match(r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$', v):
            raise ValueError('Time must be in HH:MM format')
        return v

class Class(ClassBase):
    id: int
    current_enrollment: int = Field(0, alias="currentEnrollment")
    is_active: bool = Field(True, alias="isActive")
    created_at: datetime = Field(..., alias="createdAt")

    class Config:
        from_attributes = True
        populate_by_name = True

class BookingBase(BaseModel):
    student_id: int = Field(..., alias="studentId")
    class_id: int = Field(..., alias="classId")
    booked_by: int = Field(..., alias="bookedBy")

class BookingCreate(BookingBase):
    pass

class Booking(BookingBase):
    id: int
    booked_at: datetime = Field(..., alias="bookedAt")
    is_active: bool = Field(True, alias="isActive")
    created_at: datetime = Field(..., alias="createdAt")

    class Config:
        from_attributes = True
        populate_by_name = True

class StudentBookingWithClass(BaseModel):
    id: int
    student_id: int = Field(..., alias="studentId")
    class_id: int = Field(..., alias="classId")
    booked_at: datetime = Field(..., alias="bookedAt")
    is_active: bool = Field(True, alias="isActive")
    created_at: datetime = Field(..., alias="createdAt")
    # Class details
    class_name: str = Field(..., alias="className")
    class_description: Optional[str] = Field(None, alias="classDescription")
    day_of_week: str = Field(..., alias="dayOfWeek")
    start_time: str = Field(..., alias="startTime")
    end_time: str = Field(..., alias="endTime")
    belt_level_required: str = Field(..., alias="beltLevelRequired")

    class Config:
        from_attributes = True
        populate_by_name = True

class AttendanceBase(BaseModel):
    student_id: int = Field(..., alias="studentId")
    class_id: int = Field(..., alias="classId")
    dojo_id: int = Field(..., alias="dojoId")
    check_in_method: CheckInMethod = Field(CheckInMethod.QR_CODE, alias="checkInMethod")
    notes: Optional[str] = None
    checked_in_by: Optional[int] = Field(None, alias="checkedInBy")

class AttendanceCreate(AttendanceBase):
    pass

class Attendance(AttendanceBase):
    id: int
    check_in_time: datetime = Field(..., alias="checkInTime")
    created_at: datetime = Field(..., alias="createdAt")

    class Config:
        from_attributes = True
        populate_by_name = True

# Request/Response Models
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    user: User
    accessToken: str
    message: str = "Login successful"

class QRCodeScanRequest(BaseModel):
    qr_code: str = Field(..., alias="qrCode")
    class_id: int = Field(..., alias="classId")

    @validator('qr_code')
    def validate_qr_code(cls, v):
        import re
        if not re.match(r'^DOJO:\d+:STUDENT:\d+$', v):
            raise ValueError('Invalid QR code format')
        return v

class HealthResponse(BaseModel):
    status: str = "ok"
    message: str = "YOLO Dojo API running"

# Session Models
class SessionData(BaseModel):
    user_id: int = Field(..., alias="userId")
    user_role: UserRole = Field(..., alias="userRole")
    username: str 