from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import uvicorn
import os
from dotenv import load_dotenv

from database import init_db
from routes import router
from models import HealthResponse

load_dotenv()

app = FastAPI(
    title="YOLO Dojo API",
    description="Martial Arts Management System API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    await init_db()

@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve basic frontend for testing"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>YOLO Dojo</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .status { color: green; }
            .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; }
            .test { background: #e8f4f8; padding: 15px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <h1>🥋 YOLO Dojo Management System (FastAPI)</h1>

        <h2>Available API Endpoints:</h2>
        <div class="endpoint"><strong>POST /api/auth/login</strong> - User login</div>
        <div class="endpoint"><strong>GET /api/auth/me</strong> - Current user info</div>
        <div class="endpoint"><strong>GET /api/users</strong> - List users (instructors only)</div>
        <div class="endpoint"><strong>POST /api/users</strong> - Create user (instructors only)</div>
        <div class="endpoint"><strong>GET /api/users/{id}</strong> - Get user profile</div>
        <div class="endpoint"><strong>PUT /api/users/{id}</strong> - Update user profile</div>
        <div class="endpoint"><strong>GET /api/students</strong> - List students</div>
        <div class="endpoint"><strong>POST /api/students</strong> - Create student</div>
        <div class="endpoint"><strong>GET /api/classes</strong> - List classes</div>
        <div class="endpoint"><strong>POST /api/classes</strong> - Create class (instructors only)</div>
        <div class="endpoint"><strong>GET /api/bookings</strong> - List bookings</div>
        <div class="endpoint"><strong>POST /api/bookings</strong> - Create booking</div>
        <div class="endpoint"><strong>GET /api/attendance</strong> - List attendance</div>
        <div class="endpoint"><strong>POST /api/attendance/qr-checkin</strong> - QR code check-in</div>
        <div class="endpoint"><strong>POST /api/attendance/manual</strong> - Manual check-in (instructors only)</div>
        
        <h2>Test Users:</h2>
        <div class="test">
            <strong>Instructor:</strong> username "instructor", password "password12377"<br>
            <em>Can manage all users and access all endpoints</em>
        </div>
        <div class="test">
            <strong>Parent:</strong> username "parent", password "parent12377"<br>
            <em>Can only access own profile and children's data</em>
        </div>
        <div class="test">
            <strong>Student:</strong> username "student1", password "student12377"<br>
            <em>Can only access own profile</em>
        </div>

        <h2>API Documentation:</h2>
        <div class="endpoint">
            <a href="/docs">Swagger UI Documentation</a><br>
            <a href="/redoc">ReDoc Documentation</a>
        </div>
    </body>
    </html>
    """

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse()

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """Handle 404 errors"""
    if request.url.path.startswith("/api/"):
        return {"message": "API endpoint not found"}
    return {"message": "Not found"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    ) 