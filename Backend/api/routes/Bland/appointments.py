from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from api.Utils.helper import format_phone,find_doctor_by_name,create_calendar_event,update_calendar_event
import traceback
from database import conn,cursor

from datetime import datetime,date


Router=APIRouter()

@Router.post("/Bland/book-appointment")
async def book_appointment(request: Request):
    try:
        # 1. Parse request JSON
        body = await request.json()
        raw_dname    = body["dname"]
        raw_date     = body.get("date")            # e.g. "2025-05-31"
        raw_slot     = body["sslot"].strip()       # e.g. "4:00 pm"
        patient_id   = body["pid"]
        phone        = body.get("phone", "")     # assume already formatted

        # 2. Fetch doctor record by exact name
        cursor.execute(
            "SELECT id, max_patients, email, available_timings FROM doctors WHERE name = %s",
            (raw_dname,)
        )
        doc = cursor.fetchone()
        if not doc:
            return JSONResponse({"detail": f"No doctor found named '{raw_dname}'"}, status_code=404)

        doctor_id, max_patients, doctor_calendar_id, available_slots = doc
        if max_patients <= 0:
            return JSONResponse({"detail": f"Dr. {raw_dname} has no available slots."}, status_code=409)

        # 3. Combine date + time into datetime
        date_str = raw_date or date.today().strftime("%Y-%m-%d")
        slot_str = f"{date_str} {raw_slot.upper()}"
        try:
            full_dt = datetime.strptime(slot_str, "%Y-%m-%d %I:%M %p")
        except ValueError:
            return JSONResponse({"error": "Invalid date or time format. Use YYYY-MM-DD and HH:MM AM/PM."}, status_code=400)

        # 4. Check for existing appointment by this patient
        cursor.execute(
            "SELECT id, calendar_event_id FROM appointments WHERE patient_id = %s",
            (patient_id,)
        )
        existing = cursor.fetchone()

        if existing:
            # 4a. Reschedule existing appointment
            apt_id, old_event_id = existing
            cursor.execute(
                """
                UPDATE appointments
                SET doctor_id = %s,
                    appointment_time = %s,
                    status = %s
                WHERE id = %s
                RETURNING id
                """,
                (doctor_id, full_dt, "scheduled", apt_id)
            )
            appointment_id = cursor.fetchone()[0]
            message = "Appointment rescheduled successfully."

            # 4a-ii. Update Google Calendar event
            calendar_event_id = update_calendar_event(
                old_event_id,
                doctor_calendar_id,
                f"Appointment: {patient_id}",
                full_dt
            )
        else:
            # 4b. Create a new appointment
            cursor.execute(
                """
                INSERT INTO appointments
                  (patient_id, doctor_id, appointment_time, status, duration)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
                """,
                (patient_id, doctor_id, full_dt, "scheduled", 30)
            )
            appointment_id = cursor.fetchone()[0]
            message = "New appointment booked successfully."

            # 4b-ii. Create Google Calendar event
            calendar_event_id = create_calendar_event(
                doctor_calendar_id,
                f"Appointment: {patient_id}",
                full_dt
            )

        # 5. Update patient and doctor records
        cursor.execute(
            "UPDATE patients SET phone_number = %s, doctor_id = %s WHERE id = %s",
            (phone, doctor_id, patient_id)
        )

        # 6. Commit transaction
        conn.commit()

        # 7. Response
        return {
            "message": message,
            "appointment_id": appointment_id,
            "doctor_name": raw_dname,
            "patient_id": patient_id,
            "appointment_date": date_str,
            "appointment_time": raw_slot.upper(),
            "status": "scheduled",
            "duration_minutes": 30,
            "calendar_event_id": calendar_event_id
        }

    except Exception as e:
        if conn:
            conn.rollback()
        print("❌ Error booking appointment:", e)
        print(traceback.format_exc())
        return JSONResponse(
            {"error": "Failed to book appointment", "details": str(e)},
            status_code=500
        )

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

@Router.post("/Bland/get-appointment")
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
