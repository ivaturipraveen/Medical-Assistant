from fastapi import APIRouter, Request,HTTPException
from fastapi.responses import JSONResponse
from api.Utils.helper import create_calendar_event,update_calendar_event,format_phone,parse_date,parse_time_input,find_doctor_by_name
import traceback
from database import conn,cursor

from datetime import datetime,date


Router=APIRouter()

@Router.post("/Bland/book-appointment")
async def book_appointment(request: Request):
    try:
        body       = await request.json()
        raw_dname  = body["dname"]
        raw_date   = body.get("date")       # e.g. "31/05/2025" or "May 31, 2025"
        raw_slot   = body["sslot"]          # e.g. "4", "4pm", "4:00 pm"
        patient_id = body["pid"]
        raw_phone  = body.get("phone", "")

        # — Normalize phone —
        phone = format_phone(raw_phone)

        # — Parse date (fallback to today) —
        if raw_date:
            parsed_date = parse_date(raw_date)
            if not parsed_date:
                return JSONResponse(
                    {"detail": "Invalid date format."},
                    status_code=400
                )
        else:
            parsed_date = date.today()

        # — Parse time slot —
        try:
            parsed_time = parse_time_input(raw_slot)   # datetime.time
        except ValueError as ve:
            return JSONResponse({"detail": str(ve)}, status_code=400)

        # Combine date + time
        requested_dt = datetime.combine(parsed_date, parsed_time)

        # — Fuzzy‐find the doctor —
        found = find_doctor_by_name(cursor, raw_dname)
        if not found:
            raise HTTPException(404, f"No doctor matching '{raw_dname}'")
        canonical_name, available_slots, department = found

        # — Fetch the rest of the doctor’s record —
        cursor.execute(
            """
            SELECT id, max_patients, email
              FROM doctors
             WHERE name = %s
            """,
            (canonical_name,)
        )
        doc = cursor.fetchone()
        if not doc:
            raise HTTPException(404, f"DB record missing for '{canonical_name}'")
        doctor_id, max_patients, doctor_calendar_id = doc

        if max_patients <= 0:
            return JSONResponse(
                {"detail": f"Dr. {canonical_name} has no slots left."},
                status_code=409
            )

        # — Check slot availability —
        # assume available_slots is a list of datetimes
        if requested_dt not in available_slots:
            return JSONResponse(
                {"detail": f"Dr. {canonical_name} isn’t available at {requested_dt.strftime('%I:%M %p')} on {requested_dt.strftime('%Y-%m-%d')}."},
                status_code=409
            )

        # — Upsert appointment —
        cursor.execute(
            "SELECT id, calendar_event_id FROM appointments WHERE patient_id = %s",
            (patient_id,)
        )
        existing = cursor.fetchone()

        if existing:
            apt_id, old_event_id = existing
            cursor.execute(
                """
                UPDATE appointments
                   SET doctor_id        = %s,
                       appointment_time = %s,
                       status           = %s
                 WHERE id = %s
                RETURNING id
                """,
                (doctor_id, requested_dt, "scheduled", apt_id)
            )
            appointment_id = cursor.fetchone()[0]
            message = "Appointment rescheduled."

            calendar_event_id = update_calendar_event(
                event_id=old_event_id,
                calendar_id=doctor_calendar_id,
                title=f"Appointment with patient {patient_id}",
                new_datetime=requested_dt,
                duration_minutes=30
            )
        else:
            cursor.execute(
                """
                INSERT INTO appointments
                    (patient_id, doctor_id, appointment_time, status, duration, calendar_event_id)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (patient_id, doctor_id, requested_dt, "scheduled", 30, None)
            )
            appointment_id = cursor.fetchone()[0]
            message = "Appointment booked."

            calendar_event_id = create_calendar_event(
                doctor_calendar_id,
                patient_name=f"patient {patient_id}",
                appointment_datetime=requested_dt,
                duration_minutes=30
            )
            cursor.execute(
                "UPDATE appointments SET calendar_event_id = %s WHERE id = %s",
                (calendar_event_id, appointment_id)
            )

        # — Update patient record —
        cursor.execute(
            """
            UPDATE patients
               SET phone_number = %s,
                   doctor_id    = %s
             WHERE id = %s
            """,
            (phone, doctor_id, patient_id)
        )

        conn.commit()

        return {
            "message": message,
            "appointment_id": appointment_id,
            "doctor_name": canonical_name,
            "patient_id": patient_id,
            "appointment_date": requested_dt.strftime("%Y-%m-%d"),
            "appointment_time": requested_dt.strftime("%I:%M %p"),
            "status": "scheduled",
            "duration_minutes": 30,
            "calendar_event_id": calendar_event_id
        }

    except HTTPException as he:
        conn.rollback()
        return JSONResponse({"detail": he.detail}, status_code=he.status_code)
    except Exception as e:
        conn.rollback()
        print("❌ Error booking appointment:", e)
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
        cursor = conn.cursor()  # Safe pattern: fresh cursor per request
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
        cursor.close()

        if not rows:
            return JSONResponse(
                {
                    "appointment": False,
                    "appointment_id": None,
                    "doctor_name": None,
                    "department": None,
                    "Sdate": None,
                    "Stime": None
                },
                status_code=200
            )

        # Take the latest appointment
        appt_id, doctor_name, department, appt_time = rows[-1]

        sdate = appt_time.strftime("%Y-%m-%d")      # Example: "2025-06-01"
        stime = appt_time.strftime("%I:%M %p")       # Example: "03:45 PM"

        return JSONResponse(
            {
                "appointment": True,
                "appointment_id": appt_id,
                "doctor_name": doctor_name,
                "department": department,
                "Sdate": sdate,
                "Stime": stime
            },
            status_code=200
        )

    except Exception as e:
        print("❌ Error fetching appointments:", e)
        return JSONResponse(
            {"error": "Server error", "details": str(e)},
            status_code=500
        )
