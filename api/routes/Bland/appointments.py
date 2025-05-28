from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from api.Utils.helper import format_phone,find_doctor_by_name,create_calendar_event
import traceback
from database import conn,cursor

from datetime import datetime,date


Router=APIRouter()

@Router.post("/Bland/cancel-appointment")
async def cancel_appointment(request: Request):
    try:
        body = await request.json()
        doctor_name = body.get("doctor_name", "").strip()
        department = body.get("department", "").strip()
        appointment_time = body.get("appointment_time", "").strip()
        patient_id = body.get("pid")

        if not all([doctor_name, department, appointment_time, patient_id]):
            return JSONResponse(
                {"error": "doctor_name, department, appointment_time, and pid are required"},
                status_code=422
            )

        # Parse the appointment time
        try:
            appt_datetime = datetime.strptime(appointment_time, "%Y-%m-%d %I:%M %p")
        except ValueError:
            return JSONResponse(
                {"error": "Invalid appointment time format. Use format: YYYY-MM-DD HH:MM AM/PM"},
                status_code=422
            )

        # First find the doctor ID
        cursor.execute("""
            SELECT id FROM doctors 
            WHERE LOWER(name) = LOWER(%s) AND LOWER(department) = LOWER(%s)
        """, (doctor_name, department))
        
        doctor_row = cursor.fetchone()
        if not doctor_row:
            return JSONResponse(
                {"error": "Doctor not found with the specified name and department"},
                status_code=404
            )
        doctor_id = doctor_row[0]

        # Verify the appointment exists
        cursor.execute("""
            SELECT id FROM appointments 
            WHERE patient_id = %s 
            AND doctor_id = %s 
            AND appointment_time = %s
        """, (patient_id, doctor_id, appt_datetime))
        
        appointment_row = cursor.fetchone()
        if not appointment_row:
            return JSONResponse(
                {"error": "Appointment not found with the specified details"},
                status_code=404
            )
        appointment_id = appointment_row[0]

        # Delete the appointment
        cursor.execute("DELETE FROM appointments WHERE id = %s", (appointment_id,))

        # Increment the doctor's max_patients count
        cursor.execute("""
            UPDATE doctors 
            SET max_patients = max_patients + 1 
            WHERE id = %s
        """, (doctor_id,))

        # Update patient's doctor_id to 0 instead of NULL
        cursor.execute("""
            UPDATE patients 
            SET doctor_id = 0 
            WHERE id = %s
        """, (patient_id,))

        conn.commit()

        return JSONResponse({
            "message": "Appointment cancelled successfully",
            "appointment_id": appointment_id,
            "doctor_name": doctor_name,
            "department": department,
            "appointment_time": appointment_time
        }, status_code=200)

    except Exception as e:
        print("❌ Error cancelling appointment:", e)
        if conn:
            conn.rollback()
        return JSONResponse(
            {"error": "Failed to cancel appointment", "details": str(e)},
            status_code=500
        )

@Router.post("/Bland/book-appointment")
async def book_appointment(request: Request):
    try:
        body = await request.json()
        raw_dname    = body["dname"]
        desired_slot = body["sslot"].strip()
        raw_date     = body.get("date")  # optional, format "YYYY-MM-DD"
        patient_id   = body["pid"]
        phone        = format_phone(body["phone"])

        # 1) Find best doctor match
        result = find_doctor_by_name(cursor, raw_dname)
        if not result:
            return JSONResponse({"detail": f"No doctor found matching '{raw_dname}'"}, status_code=404)
        matched_name, _, _ = result
        lookup_name = matched_name.lower()

        # 2) Fetch doctor ID, capacity, and email
        cursor.execute(
            "SELECT id, max_patients, email FROM doctors WHERE LOWER(name) = %s",
            (lookup_name,)
        )
        row = cursor.fetchone()
        if not row:
            return JSONResponse({"error": f"Doctor '{matched_name}' not found in DB."}, status_code=404)
        doctor_id, max_patients, doctor_calendar_id = row
        if max_patients <= 0:
            return JSONResponse({"response": f"No available slots for Dr. {matched_name}."}, status_code=409)

        # 3) Parse the desired slot time
        start_str = desired_slot.split("-")[0].strip()  # e.g. "11:30 AM"
        appt_time = datetime.strptime(start_str, "%I:%M %p").time()

        # 4) Parse date or default to today
        if raw_date:
            appt_date = datetime.strptime(raw_date, "%Y-%m-%d").date()
        else:
            appt_date = date.today()

        # Combine date and time
        full_dt = datetime.combine(appt_date, appt_time)

        # 5) Check for existing appointment for patient
        cursor.execute(
            "SELECT id, doctor_id FROM appointments WHERE patient_id = %s",
            (patient_id,)
        )
        existing_appt = cursor.fetchone()

        if existing_appt:
            # Update existing appointment
            old_appt_id, old_doctor_id = existing_appt
            # Increment old doctor's slot count back
            cursor.execute(
                "UPDATE doctors SET max_patients = max_patients + 1 WHERE id = %s",
                (old_doctor_id,)
            )
            # Update appointment
            cursor.execute(
                """
                UPDATE appointments
                SET doctor_id = %s, appointment_time = %s, status = %s
                WHERE id = %s
                RETURNING id
                """, (doctor_id, full_dt, "scheduled", old_appt_id)
            )
            appointment_id = cursor.fetchone()[0]
            message = "Existing appointment updated successfully."
        else:
            # Create new appointment
            cursor.execute(
                """
                INSERT INTO appointments
                  (patient_id, doctor_id, appointment_time, status, duration)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
                """, (patient_id, doctor_id, full_dt, "scheduled", 30)
            )
            appointment_id = cursor.fetchone()[0]
            message = "New appointment booked successfully."

        # 6) Update patient's phone and doctor_id
        cursor.execute(
            "UPDATE patients SET phone_number = %s, doctor_id = %s WHERE id = %s",
            (phone, doctor_id, patient_id)
        )

        # 7) Decrement new doctor's available slots
        cursor.execute(
            "UPDATE doctors SET max_patients = max_patients - 1 WHERE id = %s",
            (doctor_id,)
        )

        # Fetch patient name for calendar event
        cursor.execute("SELECT full_name FROM patients WHERE id = %s", (patient_id,))
        patient_name = cursor.fetchone()[0]

        # 8) Create Google Calendar event
        event_id = create_calendar_event(
            doctor_calendar_id,
            patient_name,
            full_dt,
            duration_minutes=30
        )

        conn.commit()

        return {
            "message": message,
            "appointment_id": appointment_id,
            "doctor_name": matched_name,
            "patient_id": patient_id,
            "appointment_timing": full_dt.strftime("%Y-%m-%d %I:%M %p"),
            "status": "scheduled",
            "time_duration": 30,
            "remaining_slots": max_patients - 1,
            "calendar_event_id": event_id
        }

    except Exception as e:
        print("❌ Error booking appointment:", e)
        print(traceback.format_exc())
        if conn:
            conn.rollback()
        return JSONResponse(
            {"error": "Failed to book appointment", "details": str(e)},
            status_code=500
        )

@Router.get("/Bland/get-appointment")
async def get_appointment(request: Request):
    try:
        body = await request.json()
        patient_id = body.get("pid")
        if not patient_id:
            return JSONResponse({"error": "pid is required"}, status_code=422)

        # Join appointments → doctors to fetch everything in one query
        cursor.execute("""
            SELECT
                a.id,
                d.name      AS doctor_name,
                d.department,
                a.appointment_time
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            WHERE a.patient_id = %s
            ORDER BY a.appointment_time;
        """, (patient_id,))

        rows = cursor.fetchall()

        if not rows:
            return JSONResponse(
                {
                    "appointment": False,
                    "appointment_id": None,
                    "doctor_name": None,
                    "department": None,
                    "appointment_time": None
                },
                status_code=200
            )

        # If there are multiple appointments, take the most recent one
        latest_appt = rows[-1]
        appt_id, doctor_name, department, appt_time = latest_appt

        return JSONResponse(
            {
                "appointment": True,
                "appointment_id": appt_id,
                "doctor_name": doctor_name,
                "department": department,
                "appointment_time": appt_time.strftime("%Y-%m-%d %I:%M %p")
            },
            status_code=200
        )

    except Exception as e:
        print("❌ Error fetching appointments:", e)
        return JSONResponse(
            {"error": "Server error", "details": str(e)},
            status_code=500
        )
