from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes.Bland import patients, appointments, doctors
from api.routes.Dashboard import Frontend
from database import conn, cursor
from Google_calender import calendar_service

app = FastAPI()

origins = [
    "http://localhost:5173",
    "https://medical-assistant-wsw6.onrender.com/",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,           
    allow_credentials=True,
    allow_methods=["*"],              
    allow_headers=["*"],              
)

app.include_router(patients.Router)
app.include_router(appointments.Router)
app.include_router(doctors.Router)
app.include_router(Frontend.Router)

@app.get("/")
async def root():
    return {"message": "API is running"}

@app.on_event("startup")
async def startup_event():
    cursor.execute("SELECT 1;")
    print("Database connected..")
    
    # Test Google Calendar service
    if calendar_service:
        print("Google Calendar connected..")

        







