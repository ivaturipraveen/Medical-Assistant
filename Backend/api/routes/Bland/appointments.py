"""
Appointment Management API Routes

This module handles all appointment-related operations including:
- Booking new appointments
- Retrieving patient appointments  
- Cancelling existing appointments

Each endpoint integrates with:
- Database for persistence
- Google Calendar for scheduling
- Twilio for SMS notifications
"""

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from api.Utils.helper import (
    create_calendar_event,
    update_calendar_event,
    format_phone,
    parse_date,
    parse_time_input,
    find_doctor_by_name
)
from Google_calender import calendar_service
from database import conn, cursor
from TwilioConnet import client
import logging

from datetime import datetime, date

# Initialize logger for this module
logger = logging.getLogger(__name__)

# Initialize router for appointment endpoints
Router = APIRouter()


@Router.post("/Bland/book-appointment")
async def book_appointment(request: Request):
    """
    Book or reschedule an appointment for a patient.
    
    Request Body:
    {
        "dname": str,      # Doctor name (flexible matching)
        "date": str,       # Appointment date (optional, defaults to today)
        "sslot": str,      # Time slot (e.g., "08:30", "2:30 PM")
        "pid": int,        # Patient ID
        "phone": str       # Patient phone number (optional)
    }
    
    Response:
    {
        "message": str,                    # Success message
        "appointment_id": int,             # Appointment ID
        "doctor_name": str,                # Matched doctor name
        "patient_id": int,                 # Patient ID
        "appointment_date": str,           # Formatted date (YYYY-MM-DD)
        "appointment_time": str,           # Formatted time (HH:MM AM/PM)
        "status": str,                     # Appointment status
        "duration_minutes": int,           # Duration in minutes
        "calendar_event_id": str|null      # Google Calendar event ID
    }
    """
    try:
        # Parse and validate request body
        body = await request.json()
        logger.info(f"Booking request received: {body}")
        
        # Extract required fields
        raw_dname = body["dname"]          # Doctor name (required)
        raw_date = body.get("date")        # Appointment date (optional)
        raw_slot = body["sslot"]           # Time slot (required)
        patient_id = body["pid"]           # Patient ID (required)
        raw_phone = body.get("phone", "")  # Phone number (optional)

        # ━━━ Data Processing & Validation ━━━
        
        # Normalize phone number format
        phone = format_phone(raw_phone)
        
        # Parse date (use today if not provided)
        parsed_date = parse_date(raw_date) if raw_date else date.today()
        
        # Parse and validate time slot
        parsed_time = parse_time_input(raw_slot)
        
        # Combine date and time for full datetime
        requested_dt = datetime.combine(parsed_date, parsed_time)
        new_day = requested_dt.strftime('%a')      # Day of week (e.g., 'Mon')
        new_time_slot = requested_dt.time()        # Time object for availability check

        # ━━━ Doctor Lookup & Validation ━━━
        
        # Find doctor using flexible name matching
        result = find_doctor_by_name(cursor, raw_dname)
        if not result:
            raise HTTPException(404, f"No doctor matching '{raw_dname}'")
        matched_name, _, _ = result

        # Get complete doctor information
        cursor.execute("""
            SELECT id, email, department 
            FROM doctors 
            WHERE LOWER(name) = %s
        """, (matched_name.lower(),))
        
        row = cursor.fetchone()
        if not row:
            raise HTTPException(404, f"Doctor {matched_name} not found in database")
        
        doctor_id, doctor_email, doctor_department = row

        # ━━━ Check for Existing Appointment ━━━
        
        # Look for any existing appointment for this patient
        cursor.execute(
            "SELECT id, doctor_id, appointment_time, calendar_event_id FROM appointments WHERE patient_id = %s",
            (patient_id,)
        )
        existing = cursor.fetchone()

        if existing:
            # ═══ RESCHEDULING EXISTING APPOINTMENT ═══
            apt_id, old_doctor_id, old_time, old_event_id = existing

            # Free up the old doctor's time slot
            old_day = old_time.strftime('%a')
            old_time_slot = old_time.time()
            cursor.execute(
                """
                UPDATE doctor_availability
                   SET is_available = true
                 WHERE doctor_id = %s AND day_of_week = %s AND time_slot = %s
                """,
                (old_doctor_id, old_day, old_time_slot)
            )

            # Get old doctor's email for calendar event management
            cursor.execute("SELECT email FROM doctors WHERE id = %s", (old_doctor_id,))
            old_doctor_email = cursor.fetchone()[0]

            # Update appointment with new details
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
            message = "Appointment rescheduled successfully."
        else:
            # ═══ CREATING NEW APPOINTMENT ═══
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
            message = "New appointment booked successfully."

        # ━━━ Update Patient Information ━━━
        
        # Update patient's contact info and assign doctor
        cursor.execute(
            "UPDATE patients SET phone_number = %s, doctor_id = %s WHERE id = %s",
            (phone, doctor_id, patient_id)
        )

        # ━━━ Update Doctor Availability ━━━
        
        # Mark the new time slot as unavailable
        cursor.execute(
            """
            UPDATE doctor_availability
               SET is_available = false
             WHERE doctor_id = %s AND day_of_week = %s AND time_slot = %s
            """,
            (doctor_id, new_day, new_time_slot)
        )

        # Commit all database changes before external API calls
        conn.commit()
        logger.info("Database changes committed successfully")

        # ━━━ Send SMS Confirmation ━━━
        
        # Prepare and send confirmation message to patient
        message_body = (
            f"Your appointment with {matched_name} from {doctor_department} department "
            f"has been booked on {requested_dt.strftime('%Y-%m-%d')} at "
            f"{requested_dt.strftime('%I:%M %p')}. Please arrive 10 minutes early. "
            f"-Medical Clinic"
        )
        
        try:
            client.messages.create(
                to=phone,
                from_="+19788008375",
                body=message_body,
            )
            logger.info("SMS confirmation sent successfully")
        except Exception as sms_err:
            logger.warning(f"SMS sending failed: {sms_err}")

        # ━━━ Google Calendar Integration ━━━
        
        calendar_event_id = None
        try:
            if existing:
                # Update existing calendar event
                calendar_event_id = update_calendar_event(
                    event_id=old_event_id,
                    calendar_id=old_doctor_email,
                    title=f"Appointment with patient {patient_id}",
                    new_datetime=requested_dt,
                    duration_minutes=30
                )
                logger.info("Calendar event updated successfully")
            else:
                # Create new calendar event
                cursor.execute("SELECT full_name FROM patients WHERE id = %s", (patient_id,))
                patient_name = cursor.fetchone()[0]

                calendar_event_id = create_calendar_event(
                    doctor_email,
                    patient_name,
                    requested_dt,
                    duration_minutes=30
                )

                # Store the calendar event ID in database
                cursor.execute(
                    "UPDATE appointments SET calendar_event_id = %s WHERE id = %s",
                    (calendar_event_id, appointment_id)
                )
                conn.commit()
                logger.info("Calendar event created successfully")

        except Exception as cal_err:
            logger.warning(f"Calendar integration failed (appointment still booked): {cal_err}")
            calendar_event_id = None

        # ━━━ Prepare Success Response ━━━
        
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
        # Handle known HTTP exceptions (e.g., doctor not found)
        conn.rollback()
        logger.error(f"HTTP Exception: {he.detail}")
        return JSONResponse({"detail": he.detail}, status_code=he.status_code)

    except Exception as e:
        # Handle unexpected errors with rollback
        conn.rollback()
        logger.error(f"Unexpected error during appointment booking: {e}")
        return JSONResponse(
            {"error": "Failed to book appointment", "details": str(e)},
            status_code=500
        )


@Router.post("/Bland/get-appointment")
async def get_appointment(request: Request):
    """
    Retrieve the latest appointment for a patient.
    
    Request Body:
    {
        "pid": int    # Patient ID (required)
    }
    
    Response (Appointment Found):
    {
        "appointment": true,
        "appointment_id": int,         # Appointment ID
        "doctor_name": str,            # Doctor's full name
        "department": str,             # Doctor's department
        "Sdate": str,                  # Appointment date (YYYY-MM-DD)
        "Stime": str                   # Appointment time (HH:MM AM/PM)
    }
    
    Response (No Appointment):
    {
        "appointment": false,
        "appointment_id": null,
        "doctor_name": null,
        "department": null,
        "Sdate": null,
        "Stime": null
    }
    """
    try:
        # Parse and validate request body
        body = await request.json()
        patient_id = body.get("pid")
        
        # Validate required patient ID
        if not patient_id:
            return JSONResponse(
                {"error": "Patient ID (pid) is required"}, 
                status_code=422
            )

        logger.info(f"Fetching appointments for patient ID: {patient_id}")

        # ━━━ Database Query for Patient Appointments ━━━
        
        # Create fresh cursor for this request (thread-safe pattern)
        cursor = conn.cursor()
        
        try:
            # Join appointments with doctors to get complete information
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
            
            # ━━━ Handle No Appointments Found ━━━
            
            if not rows:
                logger.info(f"No appointments found for patient {patient_id}")
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

            # ━━━ Process Latest Appointment ━━━
            
            # Get the most recent appointment (last in ordered list)
            appt_id, doctor_name, department, appt_time = rows[-1]

            # Format date and time for response
            sdate = appt_time.strftime("%Y-%m-%d")      # ISO date format
            stime = appt_time.strftime("%I:%M %p")       # 12-hour time format

            logger.info(f"Found appointment: {appt_id} with Dr. {doctor_name} on {sdate} at {stime}")

            # ━━━ Prepare Success Response ━━━
            
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

        finally:
            # Always close cursor to prevent connection leaks
            cursor.close()

    except Exception as e:
        logger.error(f"Error fetching patient appointments: {e}")
        return JSONResponse(
            {"error": "Failed to retrieve appointments", "details": str(e)},
            status_code=500
        )


@Router.post("/Bland/cancel-appointment")
async def cancel_appointment(request: Request):
    """
    Cancel an existing appointment and free up the time slot.
    
    Request Body:
    {
        "doctor_name": str,    # Doctor's name (required)
        "department": str,     # Doctor's department (required)
        "date": str,           # Appointment date (required)
        "time": str,           # Appointment time (required)
        "pid": int             # Patient ID (required)
    }
    
    Response:
    {
        "message": str,            # Success message
        "appointment_id": int,     # Cancelled appointment ID
        "doctor_name": str,        # Doctor's name
        "department": str,         # Doctor's department
        "date": str,              # Original date
        "time": str,              # Original time
        "status": str             # New status ("cancelled")
    }
    """
    try:
        # Parse and validate request body
        body = await request.json()
        
        # Extract and clean input parameters
        doctor_name = body["doctor_name"].strip()
        department = body["department"].strip()
        raw_date = body["date"].strip()
        raw_time = body["time"].strip()
        patient_id = body["pid"]

        logger.info(f"Cancellation request: Dr. {doctor_name} ({department}) on {raw_date} at {raw_time} for patient {patient_id}")

        # ━━━ Input Validation ━━━
        
        # Ensure all required fields are provided
        if not all([doctor_name, department, raw_date, raw_time, patient_id]):
            return JSONResponse(
                {"error": "All fields (doctor_name, department, date, time, pid) are required"},
                status_code=422
            )

        # ━━━ Parse Date and Time ━━━
        
        # Parse and validate date format
        parsed_date = parse_date(raw_date)
        if not parsed_date:
            return JSONResponse(
                {"error": "Invalid date format. Please use a valid date."}, 
                status_code=422
            )

        # Parse and validate time format
        try:
            parsed_time = parse_time_input(raw_time)
        except ValueError as ve:
            return JSONResponse(
                {"error": f"Invalid time format: {str(ve)}"}, 
                status_code=422
            )

        # Combine date and time for exact appointment matching
        appt_datetime = datetime.combine(parsed_date, parsed_time)
        day_of_week = appt_datetime.strftime("%a")  # Abbreviated day format for availability

        # ━━━ Doctor Lookup and Validation ━━━
        
        # Find doctor using flexible name matching
        result = find_doctor_by_name(cursor, doctor_name)
        if not result:
            raise HTTPException(404, f"No doctor matching '{doctor_name}'")
        matched_name, _, _ = result

        # Get doctor details with department verification
        cursor.execute("""
            SELECT id, email 
            FROM doctors 
            WHERE LOWER(name) = LOWER(%s) AND LOWER(department) = LOWER(%s)
        """, (matched_name, department))
        
        doc_row = cursor.fetchone()
        if not doc_row:
            return JSONResponse(
                {"error": f"Doctor '{matched_name}' not found in '{department}' department"}, 
                status_code=404
            )
        doctor_id, doctor_calendar_id = doc_row

        # ━━━ Find and Validate Appointment ━━━
        
        # Locate the specific appointment to cancel
        cursor.execute("""
            SELECT id, calendar_event_id 
            FROM appointments 
            WHERE patient_id = %s AND doctor_id = %s AND appointment_time = %s
        """, (patient_id, doctor_id, appt_datetime))
        
        appt_row = cursor.fetchone()
        if not appt_row:
            return JSONResponse(
                {
                    "error": "Appointment not found for the specified details", 
                    "matched_doctor": matched_name
                }, 
                status_code=404
            )
        appointment_id, calendar_event_id = appt_row

        logger.info(f"Found appointment {appointment_id} to cancel")

        # ━━━ Database Updates ━━━
        
        # Free up the doctor's time slot
        cursor.execute("""
            UPDATE doctor_availability 
            SET is_available = true 
            WHERE doctor_id = %s 
            AND day_of_week = %s 
            AND time_slot = %s
        """, (doctor_id, day_of_week, parsed_time.strftime("%H:%M:%S")))

        # Remove the appointment record
        cursor.execute("DELETE FROM appointments WHERE id = %s", (appointment_id,))

        # Unassign doctor from patient (set to default/unassigned)
        cursor.execute("""
            UPDATE patients 
            SET doctor_id = 0 
            WHERE id = %s
        """, (patient_id,))

        logger.info("Database updates completed")

        # ━━━ Google Calendar Integration ━━━
        
        # Attempt to delete the calendar event
        try:
            if calendar_event_id:
                calendar_service.events().delete(
                    calendarId=doctor_calendar_id,
                    eventId=calendar_event_id
                ).execute()
                logger.info("Calendar event deleted successfully")
        except Exception as cal_err:
            logger.warning(f"Failed to delete calendar event: {cal_err}")

        # Commit all database changes
        conn.commit()

        # ━━━ SMS Notification ━━━
        
        # Get patient's phone number for cancellation confirmation
        cursor.execute("SELECT phone_number FROM patients WHERE id = %s", (patient_id,))
        patient_phone_row = cursor.fetchone()
        patient_phone = patient_phone_row[0] if patient_phone_row else None

        # Send cancellation confirmation SMS
        if patient_phone:
            try:
                cancel_message_body = (
                    f"Your appointment with {matched_name} from {department} department "
                    f"scheduled on {appt_datetime.strftime('%Y-%m-%d')} at "
                    f"{appt_datetime.strftime('%I:%M %p')} has been cancelled successfully. "
                    f"If you have questions, please contact the clinic. -Medical Clinic"
                )
                
                client.messages.create(
                    to=patient_phone,
                    from_="+19788008375",
                    body=cancel_message_body,
                )
                logger.info("Cancellation SMS sent successfully")
            except Exception as sms_err:
                logger.warning(f"Failed to send cancellation SMS: {sms_err}")

        # ━━━ Prepare Success Response ━━━
        
        return JSONResponse({
            "message": "Appointment cancelled successfully",
            "appointment_id": appointment_id,
            "doctor_name": matched_name,
            "department": department,
            "date": raw_date,
            "time": raw_time,
            "status": "cancelled"
        }, status_code=200)

    except HTTPException as he:
        # Handle known HTTP exceptions
        if conn:
            conn.rollback()
        logger.error(f"HTTP Exception during cancellation: {he.detail}")
        return JSONResponse({"detail": he.detail}, status_code=he.status_code)

    except Exception as e:
        # Handle unexpected errors with rollback
        logger.error(f"Unexpected error during appointment cancellation: {e}")
        if conn:
            conn.rollback()
        return JSONResponse(
            {"error": "Failed to cancel appointment", "details": str(e)},
            status_code=500
        )
