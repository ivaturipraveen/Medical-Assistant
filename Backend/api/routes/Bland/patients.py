from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from api.Utils.helper import parse_date
import json
from database import conn,cursor

Router=APIRouter()

@Router.post("/Bland/validate-users")
async def validate_users(request: Request):
    try:
        data = json.loads(await request.body())
        dob_str = data.get("dob", "").strip()
        phone = data.get("phone", "")
        print(dob_str,phone)


        if not dob_str or dob_str.lower() == 'null':
            return JSONResponse({"error": "Date of birth is required"}, status_code=422)

        dob = parse_date(dob_str)
        if dob is None:
            return JSONResponse({"error": "Invalid date format."}, status_code=422)

        # Check existing patient by phone and dob
        cursor.execute(
            "SELECT id, full_name, dob, phone_number FROM patients WHERE phone_number=%s AND dob=%s;",
            (phone, dob)
        )
        row = cursor.fetchone()

        if row:
            pid, name, dob_db, phone_db = row
            # fetch appointment existence
            cursor.execute("SELECT 1 FROM appointments WHERE patient_id=%s LIMIT 1;", (pid,))
            has_appt = bool(cursor.fetchone())

            return JSONResponse({
                "message": "Patient exists.",
                "patient_id": pid,
            }, status_code=200)
        else:
            return JSONResponse({"message": "Patient does not exist."}, status_code=404)

    except Exception as e:
        return JSONResponse({"error":"Server error","details":str(e)}, status_code=500)
    
@Router.post("/Bland/create-user")
async def create_user(request: Request):
    try:
        data = json.loads(await request.body())
        first_name = data.get("first_name", "").strip().title()
        last_name = data.get("last_name", "").strip().title()
        dob_str = data.get("dob", "").strip()
        phone = data.get("phone", "")


        dob = parse_date(dob_str)

        full_name = f"{first_name} {last_name}"

        # Insert new patient with doctor_id = 0
        cursor.execute(
            "INSERT INTO patients (full_name, dob, phone_number, doctor_id, status) VALUES (%s, %s, %s, %s, %s) RETURNING id;",
            (full_name, dob, phone ,0, 'active')
        )
        new_id = cursor.fetchone()[0]
        conn.commit()

        return JSONResponse({
            "message": "New patient created.",
            "patient_id": new_id,
        }, status_code=201)

    except Exception as e:
        return JSONResponse({"error": "Server error", "details": str(e)}, status_code=500)

