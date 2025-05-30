from fastapi import  APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from database import conn,cursor

router = APIRouter()

# Pydantic model for login data
class LoginData(BaseModel):
    email: str
    password: str

# Admin login endpoint
@router.post('/admin/login')
async def admin_login(login_data: LoginData):
    try:
        cursor.execute(
            "SELECT id, name, email FROM admin WHERE email = %s AND password = %s",
            (login_data.email, login_data.password)
        )
        admin = cursor.fetchone()
        if not admin:
            return JSONResponse(content={"error": "Invalid email or password"}, status_code=401)
        return {
            "message": "Admin login successful",
            "admin": {
                "id": admin[0],
                "name": admin[1],
                "email": admin[2]
            }
        }
    except Exception as e:
        return JSONResponse(content={"error": f"Admin login failed: {str(e)}"}, status_code=500)

# Doctor login endpoint
@router.post('/doctor/login')
async def doctor_login(login_data: LoginData):
    try:
        cursor.execute(
            "SELECT id, name, department, email FROM doctors WHERE email = %s AND password = %s",
            (login_data.email, login_data.password)
        )
        doctor = cursor.fetchone()
        if not doctor:
            return JSONResponse(content={"error": "Invalid email or password"}, status_code=401)
        return {
            "message": "Doctor login successful",
            "doctor": {
                "id": doctor[0],
                "name": doctor[1],
                "department": doctor[2],
                "email": doctor[3]
            }
        }
    except Exception as e:
        return JSONResponse(content={"error": f"Doctor login failed: {str(e)}"}, status_code=500)
