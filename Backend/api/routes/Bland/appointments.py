from fastapi import APIRouter, Request,HTTPException
from fastapi.responses import JSONResponse
from api.Utils.helper import create_calendar_event,update_calendar_event,format_phone,parse_date,parse_time_input,find_doctor_by_name
from Google_calender import calendar_service
from database import conn,cursor
from TwilioConnet import client

from datetime import datetime,date


Router=APIRouter()

@Router.post("/Bland/book-appointment")
async def book_appointment(request: Request):
    try:
        body       = await request.json()
        print(body)
        raw_dname  = body["dname"]
        raw_date   = body.get("date")      # e.g. "2025-05-31"
        raw_slot   = body["sslot"]         # e.g. "4pm" or "4:00 PM"
        patient_id = body["pid"]
        raw_phone  = body.get("phone", "")

        # — Normalize phone, parse date & time —
        phone = format_phone(raw_phone)
        parsed_date = parse_date(raw_date) if raw_date else date.today()
        parsed_time = parse_time_input(raw_slot)
        requested_dt = datetime.combine(parsed_date, parsed_time)

        # — Find doctor —
        result = find_doctor_by_name(cursor, raw_dname)
        if not result:
            raise HTTPException(404, f"No doctor matching '{raw_dname}'")
        matched_name, _, _ = result

        # Get doctor ID and email
        cursor.execute("""
            SELECT id, email,department 
            FROM doctors 
            WHERE LOWER(name) = %s
        """, (matched_name.lower(),))
        
        row = cursor.fetchone()
        if not row:
            raise HTTPException(404, f"Doctor {matched_name} not found")
        
        doctor_id, doctor_email, doctor_department = row

        # — Check for existing appointment —
        cursor.execute(
            "SELECT id, doctor_id, calendar_event_id FROM appointments WHERE patient_id = %s",
            (patient_id,)
        )
        existing = cursor.fetchone()

        if existing:
            apt_id, old_doctor_id, old_event_id = existing

            # Get the old doctor's email for calendar event update
            cursor.execute("SELECT email FROM doctors WHERE id = %s", (old_doctor_id,))
            old_doctor_email = cursor.fetchone()[0]

            # Update the appointment record
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
        else:
            # Insert new appointment
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
            message = "New appointment booked."

        # — Update patient contact & assigned doctor —
        cursor.execute(
            "UPDATE patients SET phone_number = %s, doctor_id = %s WHERE id = %s",
            (phone, doctor_id, patient_id)
        )

        # — Commit all booking-related DB changes —
        conn.commit()
        message_body = f"Your appointment with {matched_name} from {doctor_department} department has been booked on the date {requested_dt.strftime('%Y-%m-%d')} at {requested_dt.strftime('%I:%M %p')}. Please arrive 10 minutes early. -Medical Clinic"
        client.messages.create(
                    to=phone ,
                    from_="+19788008375",
                    body=message_body,
                )
        # — Calendar integration (best-effort) —
        try:
            if existing:
                calendar_event_id = update_calendar_event(
                    event_id=old_event_id,
                    calendar_id=old_doctor_email,
                    title=f"Appointment with patient {patient_id}",
                    new_datetime=requested_dt,
                    duration_minutes=30
                )
            else:
                cursor.execute("SELECT full_name FROM patients WHERE id = %s", (patient_id,))
                patient_name = cursor.fetchone()[0]

                calendar_event_id = create_calendar_event(
                    doctor_email,
                    patient_name,
                    requested_dt,
                    duration_minutes=30
                )

                # store the new event ID
                cursor.execute(
                    "UPDATE appointments SET calendar_event_id = %s WHERE id = %s",
                    (calendar_event_id, appointment_id)
                )
                conn.commit()
          

        except Exception as cal_err:
            print("⚠️ Calendar error (booking persisted):", cal_err)
            calendar_event_id = None

        return {
            "message": message,
            "appointment_id": appointment_id,
            "doctor_name": matched_name,
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


@Router.post("/Bland/cancel-appointment")
async def cancel_appointment(request: Request):
    try:
        body = await request.json()
        doctor_name = body["doctor_name"].strip()
        department = body["department"].strip()
        raw_date = body["date"].strip()
        raw_time = body["time"].strip()
        patient_id = body["pid"]

        if not all([doctor_name, department, raw_date, raw_time, patient_id]):
            return JSONResponse(
                {"error": "doctor_name, department, date, time, and pid are required"},
                status_code=422
            )

        # Parse date and time
        parsed_date = parse_date(raw_date)
        if not parsed_date:
            return JSONResponse({"error": "Invalid date format."}, status_code=422)

        try:
            parsed_time = parse_time_input(raw_time)
        except ValueError as ve:
            return JSONResponse({"error": str(ve)}, status_code=422)

        appt_datetime = datetime.combine(parsed_date, parsed_time)
        day_of_week = appt_datetime.strftime("%a")  # Using abbreviated day format

        # Find doctor using flexible matching
        result = find_doctor_by_name(cursor, doctor_name)
        if not result:
            raise HTTPException(404, f"No doctor matching '{doctor_name}'")
        matched_name, _, _ = result

        # Get doctor ID and calendar ID
        cursor.execute("""
            SELECT id, email 
            FROM doctors 
            WHERE LOWER(name) = LOWER(%s) AND LOWER(department) = LOWER(%s)
        """, (matched_name, department))
        doc_row = cursor.fetchone()
        if not doc_row:
            return JSONResponse({"error": "Doctor not found"}, status_code=404)
        doctor_id, doctor_calendar_id = doc_row

        # Get appointment info
        cursor.execute("""
            SELECT id, calendar_event_id 
            FROM appointments 
            WHERE patient_id = %s AND doctor_id = %s AND appointment_time = %s
        """, (patient_id, doctor_id, appt_datetime))
        appt_row = cursor.fetchone()
        if not appt_row:
            return JSONResponse({"error": "Appointment not found", "name": matched_name}, status_code=404)
        appointment_id, calendar_event_id = appt_row

        # Mark the time slot as available again
        cursor.execute("""
            UPDATE doctor_availability 
            SET is_available = true 
            WHERE doctor_id = %s 
            AND day_of_week = %s 
            AND time_slot = %s
        """, (doctor_id, day_of_week, parsed_time.strftime("%H:%M:%S")))

        # Delete appointment
        cursor.execute("DELETE FROM appointments WHERE id = %s", (appointment_id,))

        # Set patient's doctor_id to null
        cursor.execute("""
            UPDATE patients 
            SET doctor_id = 0 
            WHERE id = %s
        """, (patient_id,))

        # Try to delete the calendar event
        try:
            if calendar_event_id:
                calendar_service.events().delete(
                    calendarId=doctor_calendar_id,
                    eventId=calendar_event_id
                ).execute()
        except Exception as cal_err:
            print("⚠️ Failed to delete calendar event:", cal_err)

        conn.commit()

        # Send cancellation SMS confirmation
        cursor.execute("SELECT phone_number FROM patients WHERE id = %s", (patient_id,))
        patient_phone_row = cursor.fetchone()
        patient_phone = patient_phone_row[0] if patient_phone_row else None

        if patient_phone:
            try:
                cancel_message_body = (
                    f"Your appointment with {matched_name} from {department} department "
                    f"scheduled on {appt_datetime.strftime('%Y-%m-%d')} at {appt_datetime.strftime('%I:%M %p')} "
                    f"has been cancelled successfully. If you have questions, please contact the clinic."
                )
                client.messages.create(
                    to=patient_phone,
                    from_="+19788008375",
                    body=cancel_message_body,
                )
            except Exception as sms_err:
                print("⚠️ Failed to send cancellation SMS:", sms_err)

        return JSONResponse({
            "message": "Appointment cancelled successfully",
            "appointment_id": appointment_id,
            "doctor_name": matched_name,
            "department": department,
            "date": raw_date,
            "time": raw_time,
            "status": "cancelled"
        }, status_code=200)

    except Exception as e:
        print("❌ Error cancelling appointment:", e)
        if conn:
            conn.rollback()
        return JSONResponse(
            {"error": "Failed to cancel appointment", "details": str(e)},
            status_code=500
        )
