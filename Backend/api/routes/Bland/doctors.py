from fastapi import APIRouter,Request
from api.Utils.helper import parse_time_input,find_doctor_by_name, parse_date
import difflib
import json
from datetime import datetime,timedelta,date
from fastapi.responses import JSONResponse
import re
from database import conn,cursor


Router=APIRouter() 

@Router.post("/Bland/get-doctors")
async def get_doctors(request : Request):
    d = json.loads(await request.body())
    print("Received JSON:", d)
    raw_department=d["department"].lower()
    try:
        cursor.execute("SELECT DISTINCT LOWER(department) FROM doctors;")
        departments = [row[0] for row in cursor.fetchall()]

        match = difflib.get_close_matches(raw_department, departments, n=1, cutoff=0.5)
        if match:
            corrected_department = match[0]
        else:
            corrected_department = raw_department 
        cursor.execute("SELECT name FROM doctors WHERE LOWER(department) = %s", (corrected_department,))
        rows = cursor.fetchall()

        if not rows:
            return {"response": f"this is here{departments}"}

        doctor_names = [row[0] for row in rows]
        print(doctor_names)
        response_text = ", ".join(doctor_names)
        return JSONResponse({
                "doctor_name": response_text,
            }, status_code=200)

    except Exception as e:
        return {"error": str(e)}

@Router.post("/Bland/time-slot")
async def get_time_slot(request: Request):
    try:
        data = await request.json()
        print(data)
        raw_input = data.get("d_name", "").strip()
        selected_date = data.get("S_date", "").strip()

        if not raw_input or not selected_date:
            return JSONResponse(
                {"error": "Doctor name and date are required."}, 
                status_code=422
            )

        # Parse the selected date using helper function
        parsed_date = parse_date(selected_date)
        if not parsed_date:
            return JSONResponse(
                {"error": "Invalid date format. Please use a valid date format (e.g., YYYY-MM-DD, DD/MM/YYYY, Month DD YYYY)"}, 
                status_code=400
            )

        # Get the day of week for the selected date
        day_of_week = parsed_date.strftime("%a")  # Returns abbreviated day (e.g., "Mon", "Tue")

        # Find doctor using flexible matching
        result = find_doctor_by_name(cursor, raw_input)
        if not result:
            return JSONResponse(
                {"error": f"No doctor found matching '{raw_input}'"},
                status_code=404
            )
        matched_name, _, _ = result

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
        
        if not time_slots:
            return JSONResponse({
                "doctor_name": matched_name,
                "date": parsed_date.strftime("%Y-%m-%d"),
                "available_slots": [],
                "availability": "Not Available"
            }, status_code=200)



        # Format time slots to 12-hour format
        formatted_slots = []
        for slot in time_slots:
            time_obj = datetime.strptime(str(slot[0]), "%H:%M:%S")
            formatted_time = time_obj.strftime("%I:%M %p")
            formatted_slots.append(formatted_time)
        
        response_text = ", ".join(formatted_slots)

        return JSONResponse({
            "doctor_name": matched_name,
            "date": parsed_date.strftime("%Y-%m-%d"),
            "available_slots": formatted_slots,
            "available_string": response_text,
            "availability": "Available"
        }, status_code=200)

    except Exception as e:
        print(f"Error in time-slot: {str(e)}")
        return JSONResponse(
            {"error": "Failed to get time slots", "details": str(e)},
            status_code=500
        )

@Router.post("/Bland/check-avail")
async def check_avail(request: Request):
    data = await request.json()
    doctor_name = data.get("d_name", "").strip()
    requested_date = data.get("S_date", "").strip()

    if not doctor_name or not requested_date:
        return JSONResponse(
            {"error": "Doctor name and date are required"},
            status_code=422
        )

    # Parse the requested date
    parsed_date = parse_date(requested_date)
    if not parsed_date:
        return JSONResponse(
            {"error": "Invalid date format. Please use a valid date format"},
            status_code=400
        )

    # Find doctor using flexible matching
    result = find_doctor_by_name(cursor, doctor_name)
    if not result:
        return JSONResponse(
            {"error": f"Doctor not found matching '{doctor_name}'"}, 
            status_code=404
        )
    matched_name, _, _ = result

    # Get the day of week for the requested date
    req_day = parsed_date.strftime("%a")  # Returns abbreviated day (e.g., "Mon", "Tue")

    # Check if doctor is available on the requested date
    cursor.execute("""
        SELECT da.time_slot
        FROM doctors d
        JOIN doctor_availability da ON d.id = da.doctor_id
        WHERE LOWER(d.name) = %s 
        AND da.day_of_week = %s
        AND da.is_available = true;
    """, (matched_name.lower(), req_day))

    time_slots = cursor.fetchall()
    
    if time_slots:
        # Doctor is available on the requested date
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
            "slots_string":response_text
        }, status_code=200)

    # If not available on requested date, find other available dates
    cursor.execute("""
        SELECT DISTINCT da.day_of_week
        FROM doctors d
        JOIN doctor_availability da ON d.id = da.doctor_id
        WHERE LOWER(d.name) = %s
        AND da.is_available = true;
    """, (matched_name.lower(),))

    available_days = [row[0] for row in cursor.fetchall()]
    
    if not available_days:
        return JSONResponse({
            "doctor_name": matched_name,
            "requested_date": parsed_date.strftime("%Y-%m-%d"),
            "available": False,
            "message": "No available dates found for this doctor"
        }, status_code=200)

    # Generate dates for the next 14 days
    today = datetime.today()
    available_dates = []
    
    for i in range(1, 15):  # Check next 14 days
        current_date = today + timedelta(days=i)
        day_name = current_date.strftime("%a")
        
        if day_name in available_days and current_date.date() != parsed_date:
            available_dates.append(current_date.strftime("%Y-%m-%d"))

    return JSONResponse({
        "doctor_name": matched_name,
        "requested_date": parsed_date.strftime("%Y-%m-%d"),
        "available": False,
        "message": f"No slots available on {parsed_date.strftime('%Y-%m-%d')}, but available on other dates",
        "available_dates": available_dates
    }, status_code=200)

@Router.post("/Bland/fetch-date")
async def get_available_booking_dates(request: Request):
    try:
        data = await request.json()
        raw_dname = data.get("d_name", "").strip()
        
        if not raw_dname:
            return JSONResponse({"error": "Doctor name is required"}, status_code=422)

        # Normalize doctor name
        def normalize(s: str) -> str:
            return re.sub(r"[^a-z]", "", s.lower())
        norm_input = normalize(raw_dname)

        # Find doctor using flexible matching
        result = find_doctor_by_name(cursor, raw_dname)
        if not result:
            return JSONResponse(
                {"error": f"No doctor found matching '{raw_dname}'"},
                status_code=404
            )
        matched_name, _, _ = result

        # Debug: Print the matched doctor name
        print(f"Found doctor: {matched_name}")

        # Get doctor's available days with debug info
        cursor.execute("""
            SELECT DISTINCT da.day_of_week, da.time_slot
            FROM doctors d
            JOIN doctor_availability da ON d.id = da.doctor_id
            WHERE LOWER(d.name) = %s
            AND da.is_available = true;
        """, (matched_name.lower(),))
        
        availability = cursor.fetchall()
        print(f"Raw availability data: {availability}")
        
        if not availability:
            return JSONResponse(
                {"error": f"No available slots found for Dr. {matched_name}"},
                status_code=404
            )

        # Get unique days and format time slots
        available_days = list(set(day for day, _ in availability))
        formatted_availability = []
        for day, time_slot in availability:
            # Convert time to 12-hour format
            time_obj = datetime.strptime(str(time_slot), "%H:%M:%S")
            formatted_time = time_obj.strftime("%I:%M %p")
            formatted_availability.append({
                "day": day,
                "time": formatted_time
            })

        print(f"Available days: {available_days}")

        # Generate dates for the next 7 days
        today = datetime.today()
        available_dates = []
        
        # Map of abbreviated days to full days
        day_map = {
            'Mon': 'Monday',
            'Tue': 'Tuesday',
            'Wed': 'Wednesday',
            'Thu': 'Thursday',
            'Fri': 'Friday',
            'Sat': 'Saturday',
            'Sun': 'Sunday'
        }
        
        for i in range(1, 8):  # Next 7 days
            current_date = today + timedelta(days=i)
            day_name = current_date.strftime("%A")  # Full day name
            print(f"Checking day {day_name} for date {current_date.strftime('%Y-%m-%d')}")
            
            # Check if any abbreviated day in available_days maps to this full day
            if any(day_map.get(abbr_day, '') == day_name for abbr_day in available_days):
                available_dates.append(current_date.strftime("%Y-%m-%d"))

        print(f"Final available dates: {available_dates}")
        response_text = ", ".join(available_dates)

        return JSONResponse({
            "doctor_name": matched_name,
            "available_dates": available_dates,
            "dates_string": response_text
        }, status_code=200)

    except Exception as e:
        print(f"Error in fetch-date: {str(e)}")
        return JSONResponse(
            {"error": "Failed to get booking dates", "details": str(e)},
            status_code=500
        )

