from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes.Bland import patients, appointments, doctors
from api.routes.Dashboard import Frontend,Login
from database import conn, cursor
from Google_calender import calendar_service
from TwilioConnet import client
import logging_config  # Import logging configuration
import logging

# Get logger for this module
logger = logging.getLogger(__name__)

app = FastAPI()

origins = [
    "http://localhost:5173",
    "https://medical-assistant-wsw6.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           
    allow_credentials=True,
    allow_methods=["*"],              
    allow_headers=["*"],              
)

app.include_router(patients.Router)
app.include_router(appointments.Router)
app.include_router(doctors.Router)
app.include_router(Frontend.Router)
app.include_router(Login.router)

@app.get("/")
async def root():
    return {"message": "API is running"}

@app.on_event("startup")
async def startup_event():
    cursor.execute("SELECT 1;")
    logger.info("Database connected successfully")
    
    # Test Google Calendar service
    if calendar_service:
        logger.info("Google Calendar service connected successfully")
    else:
        logger.warning("Google Calendar service not available")
        
    if client:
        logger.info("Twilio service connected successfully")
    else:
        logger.warning("Twilio service not available")

        







