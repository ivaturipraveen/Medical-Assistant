from fastapi import APIRouter,Request
from api.Utils.helper import parse_time_input,find_doctor_by_name
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
            return {"response": f"{departments}"}

        doctor_names = [row[0] for row in rows]
        print(doctor_names)
        response_text = ", ".join(doctor_names)
        return {"response": response_text}

    except Exception as e:
        return {"error": str(e)}

@Router.post("/Bland/time-slot")
async def get_time_slot(request: Request):
    try:
        data = await request.json()
        raw_input = data.get("d_name", "").strip()
        if not raw_input:
            return JSONResponse({"error": "Doctor name is required."}, status_code=422)

        # Normalize: lowercase, remove non-letters
        def normalize(s: str) -> str:
            return re.sub(r"[^a-z]", "", s.lower())
        norm_input = normalize(raw_input)

        # Fetch doctor and their availability
        cursor.execute("""
            SELECT d.name, da.day_of_week, da.time_slot, da.is_available 
            FROM doctors d 
            LEFT JOIN doctor_availability da ON d.id = da.doctor_id 
            WHERE da.is_available = true;
        """)
        doctor_slots = cursor.fetchall()

        # Group slots by doctor
        doctor_availability = {}
        for name, day, time_slot, is_available in doctor_slots:
            if name not in doctor_availability:
                doctor_availability[name] = []
            if is_available:
                doctor_availability[name].append(f"{day} {time_slot}")

        # Build mapping: normalized full name to (name, timings)
        norm_map = {normalize(name): (name, timings) for name, timings in doctor_availability.items()}

        name_match = None
        timings = None

        # 1. Exact normalized match
        if norm_input in norm_map:
            name_match, timings = norm_map[norm_input]
        else:
            # 2. Substring match
            for key, (nm, tm) in norm_map.items():
                if norm_input and norm_input in key:
                    name_match, timings = nm, tm
                    break
            # 3. Fallback fuzzy
            if not name_match:
                choices = list(norm_map.keys())
                fuzzy = difflib.get_close_matches(norm_input, choices, n=1, cutoff=0.5)
                if fuzzy:
                    name_match, timings = norm_map[fuzzy[0]]

        if not name_match:
            return JSONResponse(
                {"response": f"No doctor found matching '{raw_input}'."},
                status_code=404
            )

        return JSONResponse({
            "doctor_name": name_match, 
            "response": timings,
            "timings": timings
        }, status_code=200)

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@Router.post("/Bland/check-avail")
async def check_avail(request: Request):
    data = await request.json()
    doctor_name = data.get("doctor_name", "").strip()
    time_input = data.get("time", "")

    if not doctor_name or not time_input:
        return JSONResponse(
            {"detail": "`doctor_name` and `time` are required"},
            status_code=422
        )

    try:
        req_time = parse_time_input(time_input)
        req_day = datetime.now().strftime("%A")  # Get current day of week
    except ValueError as e:
        return JSONResponse({"detail": str(e)}, status_code=400)

    # Find doctor using flexible matching
    result = find_doctor_by_name(cursor, doctor_name)
    if not result:
        return JSONResponse({"detail": f"Doctor not found matching '{doctor_name}'"}, status_code=404)

    name_match, _, _ = result

    # Check if doctor is available at the requested time
    cursor.execute("""
        SELECT da.time_slot, da.is_available
        FROM doctors d
        JOIN doctor_availability da ON d.id = da.doctor_id
        WHERE LOWER(d.name) = %s 
        AND da.day_of_week = %s
        AND da.time_slot = %s
        AND da.is_available = true;
    """, (name_match.lower(), req_day, req_time.strftime("%H:%M:%S")))

    if cursor.fetchone():
        return JSONResponse({"available": True}, status_code=200)

    # Find alternative doctors in same department
    cursor.execute("""
        SELECT d.name, da.time_slot
        FROM doctors d
        JOIN doctor_availability da ON d.id = da.doctor_id
        WHERE d.department = (
            SELECT department FROM doctors WHERE LOWER(name) = %s
        )
        AND LOWER(d.name) != %s
        AND da.day_of_week = %s
        AND da.time_slot = %s
        AND da.is_available = true;
    """, (name_match.lower(), name_match.lower(), req_day, req_time.strftime("%H:%M:%S")))

    suggestions = []
    for alt_name, alt_time in cursor.fetchall():
        suggestions.append(f"{alt_name} - {alt_time}")

    return JSONResponse({
        "available": False,
        "suggestions": suggestions
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

        # Get doctor's available days
        cursor.execute("""
            SELECT DISTINCT day_of_week
            FROM doctors d
            JOIN doctor_availability da ON d.id = da.doctor_id
            WHERE LOWER(d.name) = %s
            AND da.is_available = true;
        """, (matched_name.lower(),))
        
        available_days = [row[0] for row in cursor.fetchall()]
        
        if not available_days:
            return JSONResponse(
                {"error": f"No available days found for Dr. {matched_name}"},
                status_code=404
            )

        # Generate dates for the next 7 days
        today = datetime.today()
        available_dates = []
        
        for i in range(1, 8):  # Next 7 days
            current_date = today + timedelta(days=i)
            day_name = current_date.strftime("%A")
            
            if day_name in available_days:
                available_dates.append(current_date.strftime("%Y-%m-%d"))

        return JSONResponse({
            "doctor_name": matched_name,
            "available_dates": available_dates
        }, status_code=200)

    except Exception as e:
        return JSONResponse(
            {"error": "Failed to get booking dates", "details": str(e)},
            status_code=500
        )

