"""
Patient Management API Routes

This module handles all patient-related operations including:
- Validating existing patient records
- Creating new patient profiles

Each endpoint integrates with:
- Database for patient data persistence
- Date validation and parsing utilities
- Comprehensive error handling
"""

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from api.Utils.helper import parse_date
import json
import logging
from database import conn, cursor

# Initialize logger for this module
logger = logging.getLogger(__name__)

# Initialize router for patient-related endpoints
Router = APIRouter()


@Router.post("/Bland/validate-users")
async def validate_users(request: Request):
    """
    Validate if a patient exists in the system using phone number and date of birth.
    
    Request Body:
    {
        "dob": str,      # Date of birth in various formats (required)
        "phone": str     # Phone number (required)
    }
    
    Response (Patient Found):
    {
        "message": "Patient exists.",
        "name": str,           # Patient's full name
        "patient_id": int      # Patient's unique ID
    }
    
    Response (Patient Not Found):
    {
        "message": "Patient does not exist."
    }
    
    Response (Validation Error):
    {
        "error": str    # Error description
    }
    """
    try:
        # Parse and validate request body
        data = json.loads(await request.body())
        logger.info(f"Patient validation request received: {data}")
        
        # Extract required fields
        dob_str = data.get("dob", "").strip()
        phone = data.get("phone", "")

        # ━━━ Input Validation ━━━
        
        # Validate date of birth is provided
        if not dob_str or dob_str.lower() == 'null':
            logger.warning("Date of birth is required but not provided")
            return JSONResponse(
                {"error": "Date of birth is required"}, 
                status_code=422
            )

        # ━━━ Date Processing & Validation ━━━
        
        # Parse the date of birth using helper function
        dob = parse_date(dob_str)
        if dob is None:
            logger.warning(f"Invalid date format provided: {dob_str}")
            return JSONResponse(
                {"error": "Invalid date format. Please provide a valid date."}, 
                status_code=422
            )

        logger.debug(f"Parsed DOB: {dob}, Phone: {phone}")

        # ━━━ Database Query for Patient Lookup ━━━
        
        # Check if patient exists with matching phone and date of birth
        cursor.execute(
            "SELECT id, full_name, dob, phone_number FROM patients WHERE phone_number=%s AND dob=%s;",
            (phone, dob)
        )
        row = cursor.fetchone()

        # ━━━ Process Query Results ━━━
        
        if row:
            # Patient found - extract details
            pid, name, dob_db, phone_db = row
            logger.info(f"Patient found: ID={pid}, Name={name}")
            
            # Check if patient has any existing appointments (for potential future use)
            cursor.execute("SELECT 1 FROM appointments WHERE patient_id=%s LIMIT 1;", (pid,))
            has_appt = bool(cursor.fetchone())
            logger.debug(f"Patient has existing appointments: {has_appt}")

            # ━━━ Prepare Success Response ━━━
            
            return JSONResponse({
                "message": "Patient exists.",
                "name": row[1],  # Full name from database
                "patient_id": pid,
            }, status_code=200)
        else:
            # Patient not found in database
            logger.info(f"No patient found with phone {phone} and DOB {dob}")
            return JSONResponse(
                {"message": "Patient does not exist."}, 
                status_code=201
            )

    except KeyError as ke:
        logger.error(f"Missing required field: {ke}")
        return JSONResponse(
            {"error": f"Missing required field: {ke}"}, 
            status_code=422
        )
    except Exception as e:
        logger.error(f"Unexpected error during patient validation: {e}")
        return JSONResponse(
            {"error": "Server error", "details": str(e)}, 
            status_code=500
        )


@Router.post("/Bland/create-user")
async def create_user(request: Request):
    """
    Create a new patient record in the system.
    
    Request Body:
    {
        "first_name": str,   # Patient's first name (required)
        "last_name": str,    # Patient's last name (required)
        "dob": str,          # Date of birth in various formats (required)
        "phone": str         # Phone number (required)
    }
    
    Response:
    {
        "message": "New patient created.",
        "patient_id": int    # Newly created patient's unique ID
    }
    
    Response (Error):
    {
        "error": str,        # Error description
        "details": str       # Detailed error information
    }
    """
    try:
        # Parse and validate request body
        data = json.loads(await request.body())
        logger.info(f"👤 New patient creation request: {data}")
        
        # Extract and process input fields
        first_name = data.get("first_name", "").strip().title()
        last_name = data.get("last_name", "").strip().title()
        dob_str = data.get("dob", "").strip()
        phone = data.get("phone", "")

        logger.debug(f"Processing: {first_name} {last_name}, DOB: {dob_str}, Phone: {phone}")

        # ━━━ Input Validation ━━━
        
        # Validate required fields are provided
        if not all([first_name, last_name, dob_str, phone]):
            missing_fields = []
            if not first_name: missing_fields.append("first_name")
            if not last_name: missing_fields.append("last_name")
            if not dob_str: missing_fields.append("dob")
            if not phone: missing_fields.append("phone")
            
            logger.warning(f"Missing required fields: {missing_fields}")
            return JSONResponse(
                {"error": f"Missing required fields: {', '.join(missing_fields)}"}, 
                status_code=422
            )

        # ━━━ Date Processing & Validation ━━━
        
        # Parse and validate date of birth
        dob = parse_date(dob_str)
        if dob is None:
            logger.warning(f"Invalid date format: {dob_str}")
            return JSONResponse(
                {"error": "Invalid date format. Please provide a valid date of birth."}, 
                status_code=422
            )

        # ━━━ Data Preparation ━━━
        
        # Combine first and last name for full name
        full_name = f"{first_name} {last_name}"
        logger.debug(f"Creating patient: {full_name}")

        # ━━━ Database Operations ━━━
        
        # Check if patient already exists (optional safety check)
        cursor.execute(
            "SELECT id FROM patients WHERE phone_number=%s AND dob=%s LIMIT 1;",
            (phone, dob)
        )
        existing_patient = cursor.fetchone()
        
        if existing_patient:
            logger.info(f"Patient already exists with ID: {existing_patient[0]}")
            return JSONResponse(
                {
                    "message": "Patient already exists.",
                    "patient_id": existing_patient[0]
                }, 
                status_code=200
            )

        # Insert new patient record with default values
        cursor.execute(
            """
            INSERT INTO patients (full_name, dob, phone_number, doctor_id, status) 
            VALUES (%s, %s, %s, %s, %s) 
            RETURNING id;
            """,
            (full_name, dob, phone, 0, 'active')  # doctor_id=0 means unassigned
        )
        
        # Get the newly created patient ID
        new_id = cursor.fetchone()[0]
        
        # Commit the transaction to database
        conn.commit()
        logger.info(f"New patient created successfully with ID: {new_id}")

        # ━━━ Prepare Success Response ━━━
        
        return JSONResponse({
            "message": "New patient created.",
            "patient_id": new_id,
        }, status_code=201)

    except KeyError as ke:
        # Handle missing required fields
        if conn:
            conn.rollback()
        logger.error(f"Missing required field: {ke}")
        return JSONResponse(
            {"error": f"Missing required field: {ke}"}, 
            status_code=422
        )
    except Exception as e:
        # Handle unexpected errors with database rollback
        if conn:
            conn.rollback()
        logger.error(f"Unexpected error during patient creation: {e}")
        return JSONResponse(
            {"error": "Server error", "details": str(e)}, 
            status_code=500
        )

