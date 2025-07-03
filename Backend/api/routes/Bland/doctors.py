"""
Doctor Management API Routes

This module handles all doctor-related operations including:
- Retrieving doctors by department
- Getting available time slots for doctors
- Checking doctor availability on specific dates
- Fetching available booking dates for doctors

Each endpoint integrates with:
- Database for doctor and availability data
- Flexible name matching for better user experience
"""

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from api.Utils.helper import parse_time_input, find_doctor_by_name, parse_date
import difflib
import json
import logging
from datetime import datetime, timedelta, date
import re
from database import conn, cursor

# Initialize logger for this module
logger = logging.getLogger(__name__)

# Initialize router for doctor-related endpoints
Router = APIRouter()


@Router.post("/Bland/get-doctors")
async def get_doctors(request: Request):
    """
    Retrieve all doctors in a specified department.
    
    Request Body:
    {
        "department": str    # Department name (flexible matching)
    }
    
    Response:
    {
        "doctor_name": str   # Comma-separated list of doctor names
    }
    """
    try:
        # Parse and validate request body
        d = json.loads(await request.body())
        logger.info(f"Doctor lookup request received: {d}")
        
        raw_department = d["department"].lower()

        # ━━━ Department Matching & Validation ━━━
        
        # Get all available departments for fuzzy matching
        cursor.execute("SELECT DISTINCT LOWER(department) FROM doctors;")
        departments = [row[0] for row in cursor.fetchall()]

        # Use fuzzy matching to find closest department name
        match = difflib.get_close_matches(raw_department, departments, n=1, cutoff=0.5)
        if match:
            corrected_department = match[0]
            logger.info(f"Department '{raw_department}' matched to '{corrected_department}'")
        else:
            corrected_department = raw_department
            logger.warning(f"No close match found for department '{raw_department}', using as-is")

        # ━━━ Retrieve Doctors in Department ━━━
        
        # Query doctors in the matched department
        cursor.execute("SELECT name FROM doctors WHERE LOWER(department) = %s", (corrected_department,))
        rows = cursor.fetchall()

        # Handle case where no doctors found
        if not rows:
            logger.warning(f"No doctors found in department '{corrected_department}'")
            return JSONResponse({
                "error": f"No doctors found in department '{corrected_department}'",
                "available_departments": departments
            }, status_code=404)

        # ━━━ Format Response ━━━
        
        # Extract doctor names and create response
        doctor_names = [row[0] for row in rows]
        logger.info(f"Found {len(doctor_names)} doctors: {doctor_names}")
        
        response_text = ", ".join(doctor_names)
        
        return JSONResponse({
            "doctor_name": response_text,
        }, status_code=200)

    except KeyError as ke:
        logger.error(f"Missing required field: {ke}")
        return JSONResponse(
            {"error": f"Missing required field: {ke}"}, 
            status_code=422
        )
    except Exception as e:
        logger.error(f"Unexpected error in get-doctors: {e}")
        return JSONResponse(
            {"error": "Failed to retrieve doctors", "details": str(e)}, 
            status_code=500
        )


@Router.post("/Bland/time-slot")
async def get_time_slot(request: Request):
    """
    Get available time slots for a specific doctor on a given date.
    
    Request Body:
    {
        "d_name": str,    # Doctor name (flexible matching)
        "S_date": str     # Date in various formats (YYYY-MM-DD, DD/MM/YYYY, etc.)
    }
    
    Response (Available Slots):
    {
        "doctor_name": str,           # Matched doctor name
        "date": str,                  # Formatted date (YYYY-MM-DD)
        "available_slots": [str],     # List of time slots in 12-hour format
        "available_string": str,      # Comma-separated slots string
        "availability": str           # "Available" or "Not Available"
    }
    """
    try:
        # Parse and validate request body
        data = await request.json()
        logger.info(f"Time slot request received: {data}")
        
        raw_input = data.get("d_name", "").strip()
        selected_date = data.get("S_date", "").strip()

        # ━━━ Input Validation ━━━
        
        # Ensure required fields are provided
        if not raw_input or not selected_date:
            return JSONResponse(
                {"error": "Doctor name and date are required."}, 
                status_code=422
            )

        # ━━━ Date Processing ━━━
        
        # Parse the selected date using helper function
        parsed_date = parse_date(selected_date)
        if not parsed_date:
            return JSONResponse(
                {
                    "error": "Invalid date format. Please use a valid date format (e.g., YYYY-MM-DD, DD/MM/YYYY, Month DD YYYY)"
                }, 
                status_code=400
            )

        # Get the day of week for availability lookup
        day_of_week = parsed_date.strftime("%a")  # Abbreviated day (e.g., "Mon", "Tue")
        logger.info(f"Looking for slots on {day_of_week} ({parsed_date.strftime('%Y-%m-%d')})")

        # ━━━ Doctor Lookup & Validation ━━━
        
        # Find doctor using flexible name matching
        result = find_doctor_by_name(cursor, raw_input)
        if not result:
            return JSONResponse(
                {"error": f"No doctor found matching '{raw_input}'"},
                status_code=404
            )
        matched_name, _, _ = result
        logger.info(f"Found doctor: {matched_name}")

        # ━━━ Query Available Time Slots ━━━
        
        # Get available time slots for the doctor on the selected day
        cursor.execute("""
            SELECT da.time_slot
            FROM doctors d
            JOIN doctor_availability da ON d.id = da.doctor_id
            WHERE LOWER(d.name) = %s
            AND da.day_of_week = %s
            AND da.is_available = true
            ORDER BY da.time_slot;
        """, (matched_name.lower(), day_of_week))
        
        time_slots = cursor.fetchall()
        
        # ━━━ Handle No Available Slots ━━━
        
        if not time_slots:
            logger.warning(f"No available slots found for Dr. {matched_name} on {day_of_week}")
            return JSONResponse({
                "doctor_name": matched_name,
                "date": parsed_date.strftime("%Y-%m-%d"),
                "available_slots": [],
                "availability": "Not Available"
            }, status_code=200)

        # ━━━ Format Time Slots ━━━
        
        # Convert time slots to 12-hour format for user-friendly display
        formatted_slots = []
        for slot in time_slots:
            time_obj = datetime.strptime(str(slot[0]), "%H:%M:%S")
            formatted_time = time_obj.strftime("%I:%M %p")
            formatted_slots.append(formatted_time)
        
        response_text = ", ".join(formatted_slots)
        logger.info(f"Found {len(formatted_slots)} available slots: {response_text}")

        # ━━━ Prepare Success Response ━━━
        
        return JSONResponse({
            "doctor_name": matched_name,
            "date": parsed_date.strftime("%Y-%m-%d"),
            "available_slots": formatted_slots,
            "available_string": response_text,
            "availability": "Available"
        }, status_code=200)

    except Exception as e:
        logger.error(f"Error in time-slot endpoint: {str(e)}")
        return JSONResponse(
            {"error": "Failed to get time slots", "details": str(e)},
            status_code=500
        )


@Router.post("/Bland/check-avail")
async def check_avail(request: Request):
    """
    Check if a doctor is available on a specific date, or suggest alternative dates.
    
    Request Body:
    {
        "d_name": str,    # Doctor name (flexible matching)
        "S_date": str     # Requested date in various formats
    }
    
    Response (Available on Requested Date):
    {
        "doctor_name": str,           # Matched doctor name
        "requested_date": str,        # Formatted requested date
        "available": true,
        "available_slots": [str],     # Available time slots
        "slots_string": str           # Comma-separated slots
    }
    
    Response (Not Available on Requested Date):
    {
        "doctor_name": str,           # Matched doctor name
        "requested_date": str,        # Formatted requested date
        "available": false,
        "message": str,               # Explanation message
        "available_dates": [str]      # Alternative available dates
    }
    """
    try:
        # Parse and validate request body
        data = await request.json()
        logger.info(f"Availability check request: {data}")
        
        doctor_name = data.get("d_name", "").strip()
        requested_date = data.get("S_date", "").strip()

        # ━━━ Input Validation ━━━
        
        # Ensure required fields are provided
        if not doctor_name or not requested_date:
            return JSONResponse(
                {"error": "Doctor name and date are required"},
                status_code=422
            )

        # ━━━ Date Processing ━━━
        
        # Parse the requested date
        parsed_date = parse_date(requested_date)
        if not parsed_date:
            return JSONResponse(
                {"error": "Invalid date format. Please use a valid date format"},
                status_code=400
            )

        logger.info(f"Checking availability for {parsed_date.strftime('%Y-%m-%d')}")

        # ━━━ Doctor Lookup & Validation ━━━
        
        # Find doctor using flexible name matching
        result = find_doctor_by_name(cursor, doctor_name)
        if not result:
            return JSONResponse(
                {"error": f"Doctor not found matching '{doctor_name}'"}, 
                status_code=404
            )
        matched_name, _, _ = result
        logger.info(f"Checking availability for Dr. {matched_name}")

        # ━━━ Check Availability on Requested Date ━━━
        
        # Get the day of week for the requested date
        req_day = parsed_date.strftime("%a")  # Abbreviated day format
        
        # Query available time slots for the specific date
        cursor.execute("""
            SELECT da.time_slot
            FROM doctors d
            JOIN doctor_availability da ON d.id = da.doctor_id
            WHERE LOWER(d.name) = %s 
            AND da.day_of_week = %s
            AND da.is_available = true;
        """, (matched_name.lower(), req_day))

        time_slots = cursor.fetchall()
        
        # ━━━ Handle Available on Requested Date ━━━
        
        if time_slots:
            # Doctor is available on the requested date
            logger.info(f"Dr. {matched_name} is available on {req_day}")
            
            # Format time slots to 12-hour format
            formatted_slots = []
            for slot in time_slots:
                time_obj = datetime.strptime(str(slot[0]), "%H:%M:%S")
                formatted_time = time_obj.strftime("%I:%M %p")
                formatted_slots.append(formatted_time)

            response_text = ", ".join(formatted_slots)
            
            return JSONResponse({
                "doctor_name": matched_name,
                "requested_date": parsed_date.strftime("%Y-%m-%d"),
                "available": True,
                "available_slots": formatted_slots,
                "slots_string": response_text
            }, status_code=200)

        # ━━━ Find Alternative Available Dates ━━━
        
        logger.info(f"Dr. {matched_name} not available on {req_day}, finding alternatives...")
        
        # Get all days when doctor is available
        cursor.execute("""
            SELECT DISTINCT da.day_of_week
            FROM doctors d
            JOIN doctor_availability da ON d.id = da.doctor_id
            WHERE LOWER(d.name) = %s
            AND da.is_available = true;
        """, (matched_name.lower(),))

        available_days = [row[0] for row in cursor.fetchall()]
        
        # Handle case where doctor has no availability at all
        if not available_days:
            return JSONResponse({
                "doctor_name": matched_name,
                "requested_date": parsed_date.strftime("%Y-%m-%d"),
                "available": False,
                "message": "No available dates found for this doctor"
            }, status_code=200)

        # ━━━ Generate Alternative Dates ━━━
        
        # Generate dates for the next 14 days
        today = datetime.today()
        available_dates = []
        
        for i in range(1, 15):  # Check next 14 days
            current_date = today + timedelta(days=i)
            day_name = current_date.strftime("%a")
            
            # Include dates that match available days but exclude the requested date
            if day_name in available_days and current_date.date() != parsed_date:
                available_dates.append(current_date.strftime("%Y-%m-%d"))

        logger.info(f"Found {len(available_dates)} alternative dates")

        # ━━━ Prepare Response with Alternatives ━━━
        
        return JSONResponse({
            "doctor_name": matched_name,
            "requested_date": parsed_date.strftime("%Y-%m-%d"),
            "available": False,
            "message": f"No slots available on {parsed_date.strftime('%Y-%m-%d')}, but available on other dates",
            "available_dates": available_dates
        }, status_code=200)

    except Exception as e:
        logger.error(f"Error in check-avail endpoint: {str(e)}")
        return JSONResponse(
            {"error": "Failed to check availability", "details": str(e)},
            status_code=500
        )


@Router.post("/Bland/fetch-date")
async def get_available_booking_dates(request: Request):
    """
    Get all available booking dates for a doctor in the next 7 days.
    
    Request Body:
    {
        "d_name": str    # Doctor name (flexible matching)
    }
    
    Response:
    {
        "doctor_name": str,           # Matched doctor name
        "available_dates": [str],     # List of available dates (YYYY-MM-DD)
        "dates_string": str           # Comma-separated dates string
    }
    """
    try:
        # Parse and validate request body
        data = await request.json()
        logger.info(f"Available dates request: {data}")
        
        raw_dname = data.get("d_name", "").strip()
        
        # ━━━ Input Validation ━━━
        
        # Ensure doctor name is provided
        if not raw_dname:
            return JSONResponse(
                {"error": "Doctor name is required"}, 
                status_code=422
            )

        # ━━━ Doctor Lookup & Validation ━━━
        
        # Find doctor using flexible name matching
        result = find_doctor_by_name(cursor, raw_dname)
        if not result:
            return JSONResponse(
                {"error": f"No doctor found matching '{raw_dname}'"},
                status_code=404
            )
        matched_name, _, _ = result
        logger.info(f"Fetching available dates for Dr. {matched_name}")

        # ━━━ Query Doctor's Availability ━━━
        
        # Get doctor's available days and time slots
        cursor.execute("""
            SELECT DISTINCT da.day_of_week, da.time_slot
            FROM doctors d
            JOIN doctor_availability da ON d.id = da.doctor_id
            WHERE LOWER(d.name) = %s
            AND da.is_available = true;
        """, (matched_name.lower(),))
        
        availability = cursor.fetchall()
        logger.debug(f"Raw availability data: {availability}")
        
        # Handle case where no availability found
        if not availability:
            return JSONResponse(
                {"error": f"No available slots found for Dr. {matched_name}"},
                status_code=404
            )

        # ━━━ Process Availability Data ━━━
        
        # Get unique available days
        available_days = list(set(day for day, _ in availability))
        
        # Format availability information for debugging
        formatted_availability = []
        for day, time_slot in availability:
            # Convert time to 12-hour format for readability
            time_obj = datetime.strptime(str(time_slot), "%H:%M:%S")
            formatted_time = time_obj.strftime("%I:%M %p")
            formatted_availability.append({
                "day": day,
                "time": formatted_time
            })

        logger.debug(f"Available days: {available_days}")

        # ━━━ Generate Available Dates ━━━
        
        # Generate dates for the next 7 days
        today = datetime.today()
        available_dates = []
        
        # Map of abbreviated days to full day names for matching
        day_map = {
            'Mon': 'Monday',
            'Tue': 'Tuesday',
            'Wed': 'Wednesday',
            'Thu': 'Thursday',
            'Fri': 'Friday',
            'Sat': 'Saturday',
            'Sun': 'Sunday'
        }
        
        # Check each of the next 7 days
        for i in range(1, 8):  # Next 7 days (excluding today)
            current_date = today + timedelta(days=i)
            day_name = current_date.strftime("%A")  # Full day name
            logger.debug(f"Checking {day_name} ({current_date.strftime('%Y-%m-%d')})")
            
            # Check if any abbreviated day in available_days maps to this full day
            if any(day_map.get(abbr_day, '') == day_name for abbr_day in available_days):
                available_dates.append(current_date.strftime("%Y-%m-%d"))
                logger.debug(f"Date {current_date.strftime('%Y-%m-%d')} is available")

        logger.info(f"Final available dates: {available_dates}")
        
        # ━━━ Format Response ━━━
        
        # Create comma-separated string for easy consumption
        response_text = ", ".join(available_dates)

        return JSONResponse({
            "doctor_name": matched_name,
            "available_dates": available_dates,
            "dates_string": response_text
        }, status_code=200)

    except Exception as e:
        logger.error(f"Error in fetch-date endpoint: {str(e)}")
        return JSONResponse(
            {"error": "Failed to get booking dates", "details": str(e)},
            status_code=500
        )

