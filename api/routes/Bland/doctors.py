from fastapi import APIRouter,Request
from api.Utils.helper import parse_time_input,parse_window,split_time_range,find_doctor_by_name
import difflib
import json
from datetime import datetime,timedelta,date
from fastapi.responses import JSONResponse
import re
from database import conn,cursor


Router=APIRouter()

@Router.get("/Bland/get-doctors")
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

@Router.get("/Bland/time-slot")
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

        # Fetch all doctor names
        cursor.execute("SELECT name, available_timings FROM doctors;")
        doctors = cursor.fetchall()  # list of (name, timings)

        # Build mapping: normalized full name to (name, timings)
        norm_map = {normalize(name): (name, timings) for name, timings in doctors}

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

        # Split timings into 30-minute slots
        slots = split_time_range(timings)
        return JSONResponse({"doctor_name": name_match, "response": slots,"timings": timings}, status_code=200)

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
    
@Router.get("/Bland/check-avail")
async def check_avail(request: Request):
    data = await request.json()
    doctor_name = data.get("doctor_name", "").strip()
    time_input  = data.get("time", "")

    if not doctor_name or not time_input:
        return JSONResponse(
            {"detail": "`doctor_name` and `time` are required"},
            status_code=422
        )

    try:
        req_time = parse_time_input(time_input)
    except ValueError as e:
        return JSONResponse({"detail": str(e)}, status_code=400)

    # Find doctor using flexible matching
    result = find_doctor_by_name(cursor, doctor_name)
    if not result:
        return JSONResponse({"detail": f"Doctor not found matching '{doctor_name}'"}, status_code=404)

    name_match, window, department = result
    start, end = parse_window(window)

    # Check if doctor is available at req_time
    if start <= req_time <= end:
        return JSONResponse({"available": True}, status_code=200)

    # Find colleagues in same dept (excluding this doctor)
    cursor.execute(
        """
        SELECT name, available_timings
          FROM doctors
         WHERE department = %s
           AND LOWER(name) != %s;
        """,
        (department, name_match.lower())
    )
    candidates = []
    for name, alt_win in cursor.fetchall():
        s2, e2 = parse_window(alt_win)
        if s2 <= req_time <= e2:
            diff = 0
        elif req_time < s2:
            diff = (datetime.combine(date.today(), s2) - datetime.combine(date.today(), req_time)).total_seconds()
        else:
            diff = (datetime.combine(date.today(), req_time) - datetime.combine(date.today(), e2)).total_seconds()
        candidates.append((diff, name, alt_win))

    candidates.sort(key=lambda x: x[0])
    overlapping = [c for c in candidates if c[0] == 0]
    if overlapping:
        suggestions = [f"{name} - {win}" for _, name, win in overlapping]
    elif candidates:
        _, name, win = candidates[0]
        suggestions = [f"{name} - {win}"]
    else:
        suggestions = []

    return JSONResponse({"available": False, "suggestions": suggestions}, status_code=200)

@Router.get("/Bland/fetch-date")
async def get_available_booking_dates():
    try:
        today = datetime.today()
        end_of_week = today + timedelta(days=(6 - today.weekday()))  # Sunday
        available_dates = []

        current_date = today + timedelta(days=1)
        while current_date <= end_of_week:
            available_dates.append(current_date.strftime("%Y-%m-%d"))
            current_date += timedelta(days=1)

        return JSONResponse({"available_dates": available_dates}, status_code=200)

    except Exception as e:
        return JSONResponse({"error": "Failed to get booking dates", "details": str(e)}, status_code=500)

