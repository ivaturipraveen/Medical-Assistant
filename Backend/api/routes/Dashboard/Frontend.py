from datetime import datetime
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from database import conn,cursor


Router=APIRouter()

@Router.get('/categories')
def get_categories():
    cursor.execute("SELECT DISTINCT department FROM doctors;")
    cats = [row[0] for row in cursor.fetchall()]
    return {'categories': cats}

@Router.get('/doctors')
async def get_doctors():
    try:
        cursor.execute("""
            SELECT 
                id, 
                name, 
                department, 
                email
            FROM doctors 
            ORDER BY department, name;
        """)
        rows = cursor.fetchall()
        return {
            'doctors': [
                {
                    'id': row[0],
                    'name': row[1],
                    'department': row[2],
                    'email': row[3]
                } for row in rows
            ]
        }
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@Router.get('/doctors/{doctor_id}/availability')
async def get_doctor_availability(doctor_id: int):
    try:
        cursor.execute("""
            SELECT 
                day_of_week, 
                time_slot, 
                is_available
            FROM doctor_availability
            WHERE doctor_id = %s
            ORDER BY 
                CASE 
                    WHEN day_of_week = 'Monday' THEN 1
                    WHEN day_of_week = 'Tuesday' THEN 2
                    WHEN day_of_week = 'Wednesday' THEN 3
                    WHEN day_of_week = 'Thursday' THEN 4
                    WHEN day_of_week = 'Friday' THEN 5
                    WHEN day_of_week = 'Saturday' THEN 6
                    WHEN day_of_week = 'Sunday' THEN 7
                END,
                time_slot;
        """, (doctor_id,))
        rows = cursor.fetchall()
        availability = {}
        for day, time_slot, is_available in rows:
            if day not in availability:
                availability[day] = []
            if is_available:
                availability[day].append(time_slot.strftime('%I:%M %p'))
        return {"availability": availability}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@Router.get('/patients/count')
async def get_patients_count():
    try:
        cursor.execute("SELECT COUNT(*) FROM patients;")
        count = cursor.fetchone()[0]
        return JSONResponse(content={"patients_count": count})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@Router.get('/appointments')
async def get_appointments(doctor_id: int = None):
    try:
        if doctor_id:
            cursor.execute("""
                SELECT
                    a.id,
                    a.appointment_time,
                    a.patient_id,
                    p.full_name,
                    d.name,
                    d.department,
                    a.status,
                    a.duration,
                    a.calendar_event_id
                FROM appointments a
                JOIN patients p ON a.patient_id = p.id
                JOIN doctors d ON a.doctor_id = d.id
                WHERE a.doctor_id = %s
                ORDER BY a.appointment_time;
            """, (doctor_id,))
        else:
            cursor.execute("""
                SELECT
                    a.id,
                    a.appointment_time,
                    a.patient_id,
                    p.full_name,
                    d.name,
                    d.department,
                    a.status,
                    a.duration,
                    a.calendar_event_id
                FROM appointments a
                JOIN patients p ON a.patient_id = p.id
                JOIN doctors d ON a.doctor_id = d.id
                ORDER BY a.appointment_time DESC;
            """)
        rows = cursor.fetchall()
        return {
            'appointments': [
                {
                    'appointment_id': r[0],
                    'appointment_time': r[1].strftime('%Y-%m-%d %I:%M %p'),
                    'patient_id': r[2],
                    'patient_name': r[3],
                    'doctor_name': r[4],
                    'department': r[5],
                    'status': r[6],
                    'duration': r[7],
                    'calendar_event_id': r[8]
                } for r in rows
            ]
        }
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@Router.get('/patients')
async def get_patients():
    try:
        cursor.execute("""
            SELECT 
                p.id, 
                p.full_name, 
                p.dob, 
                p.phone_number,
                p.status,
                p.doctor_id,
                d.name,
                d.department
            FROM patients p
            LEFT JOIN doctors d ON p.doctor_id = d.id
            ORDER BY p.id;
        """)
        rows = cursor.fetchall()
        return {
            'patients': [
                {
                    'id': row[0],
                    'full_name': row[1],
                    'dob': row[2].strftime('%Y-%m-%d') if row[2] else None,
                    'phone_number': row[3],
                    'status': row[4],
                    'doctor_id': row[5],
                    'doctor_name': row[6],
                    'department': row[7] if row[7] else 'Not assigned'
                } for row in rows
            ]
        }
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@Router.get('/dashboard/stats')
async def get_dashboard_stats():
    try:
        # Get total patients count
        cursor.execute("SELECT COUNT(*) FROM patients")
        total_patients = cursor.fetchone()[0]
        
        # Get total doctors count
        cursor.execute("SELECT COUNT(*) FROM doctors")
        total_doctors = cursor.fetchone()[0]
        
        # Get total appointments count
        cursor.execute("SELECT COUNT(*) FROM appointments")
        total_appointments = cursor.fetchone()[0]
        
        # Get today's appointments count
        cursor.execute("""
            SELECT COUNT(*) FROM appointments 
            WHERE DATE(appointment_time) = CURRENT_DATE
        """)
        todays_appointments = cursor.fetchone()[0]

        # Get recent appointments
        cursor.execute("""
            SELECT 
                a.id,
                p.full_name as patient_name,
                d.name as doctor_name,
                a.appointment_time
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN doctors d ON a.doctor_id = d.id
            WHERE a.appointment_time >= CURRENT_DATE
            ORDER BY a.appointment_time ASC
            LIMIT 5
        """)
        recent_appointments = [
            {
                'id': row[0],
                'patient_name': row[1],
                'doctor_name': row[2],
                'appointment_time': row[3].strftime('%Y-%m-%d %H:%M')
            }
            for row in cursor.fetchall()
        ]

        return {
            'stats': {
                'total_patients': total_patients,
                'total_doctors': total_doctors-1,
                'total_appointments': total_appointments,
                'todays_appointments': todays_appointments,
                'recent_appointments': recent_appointments
            }
        }
    except Exception as e:
        print("Error fetching dashboard stats:", str(e))
        return JSONResponse(
            content={"error": f"Failed to fetch dashboard statistics: {str(e)}"},
            status_code=500
        )

@Router.get('/dashboard/appointments-by-department')
async def get_appointments_by_department():
    try:
        cursor.execute("""
            SELECT 
                d.department,
                COUNT(*) as appointment_count
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            GROUP BY d.department
            ORDER BY appointment_count DESC;
        """)
        
        results = cursor.fetchall()
        
        return {
            'data': [
                {
                    'department': row[0],
                    'count': row[1]
                }
                for row in results
            ]
        }
    except Exception as e:
        return JSONResponse(
            content={"error": str(e)},
            status_code=500
        )

@Router.get('/dashboard/patient-growth')
async def get_patient_growth():
    try:
        cursor.execute("""
            SELECT 
                DATE_TRUNC('month', dob) as month,
                COUNT(*) as patient_count
            FROM patients
            GROUP BY DATE_TRUNC('month', dob)
            ORDER BY month
            LIMIT 12;
        """)
        
        results = cursor.fetchall()
        
        return {
            'data': [
                {
                    'month': row[0].strftime('%B %Y'),
                    'count': row[1]
                }
                for row in results
            ]
        }
    except Exception as e:
        return JSONResponse(
            content={"error": str(e)},
            status_code=500
        )

@Router.get('/dashboard/weekly-distribution')
async def get_weekly_distribution():
    try:
        cursor.execute("""
            SELECT 
                EXTRACT(DOW FROM appointment_time) as day_of_week,
                COUNT(*) as appointment_count
            FROM appointments
            WHERE appointment_time >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY day_of_week
            ORDER BY day_of_week;
        """)
        
        results = cursor.fetchall()
        
        days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        return {
            'data': [
                {
                    'day': days[int(row[0])],
                    'count': row[1]
                }
                for row in results
            ]
        }
    except Exception as e:
        return JSONResponse(
            content={"error": str(e)},
            status_code=500
        )

@Router.get('/dashboard/doctor-workload')
async def get_doctor_workload():
    try:
        cursor.execute("""
            SELECT 
                d.name,
                COUNT(a.id) as appointment_count
            FROM doctors d
            LEFT JOIN appointments a ON d.id = a.doctor_id
            GROUP BY d.id, d.name
            ORDER BY appointment_count DESC
            LIMIT 10;
        """)
        
        results = cursor.fetchall()
        
        return {
            'data': [
                {
                    'doctor': row[0],
                    'appointments': row[1]
                }
                for row in results
            ]
        }
    except Exception as e:
        return JSONResponse(
            content={"error": str(e)},
            status_code=500
        )

@Router.get('/dashboard/age-distribution')
async def get_age_distribution():
    try:
        cursor.execute("""
            SELECT 
                CASE 
                    WHEN age <= 10 THEN 'Child'
                    WHEN age BETWEEN 11 AND 20 THEN 'Teenager'
                    WHEN age BETWEEN 21 AND 40 THEN 'Adult'
                    WHEN age BETWEEN 41 AND 60 THEN 'Middle Aged'
                    ELSE 'Senior Citizen'
                END as age_category,
                COUNT(*) as patient_count
            FROM (
                SELECT 
                    EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob)) as age
                FROM patients
            ) age_calc
            GROUP BY age_category
            ORDER BY age_category;
        """)
        
        results = cursor.fetchall()
        
        return {
            'data': [
                {
                    'ageGroup': row[0],
                    'count': row[1]
                }
                for row in results
            ]
        }
    except Exception as e:
        return JSONResponse(
            content={"error": str(e)},
            status_code=500
        )

@Router.get("/slots")
async def get_doctor_slots(doctor_id: int, date: str):
    try:
        # Parse date and get abbreviated weekday (e.g., 'Mon')
        date_obj = datetime.strptime(date, "%Y-%m-%d")
        day_of_week = date_obj.strftime('%a')  # Matches 'Mon', 'Tue', etc.

        # Fetch available slots for the doctor on that day
        cursor.execute("""
            SELECT time_slot FROM doctor_availability
            WHERE doctor_id = %s AND day_of_week = %s AND is_available = TRUE
            ORDER BY time_slot;
        """, (doctor_id, day_of_week))
        available = cursor.fetchall()
        available_slots = [t[0].strftime("%H:%M") for t in available]

        if not available_slots:
            return JSONResponse({
                "doctor_id": doctor_id,
                "appointment_date": date,
                "available_slots": [],
                "booked_slots": [],
                "message": "No available slots defined for this doctor on that day."
            }, status_code=200)

        # Fetch booked slots for the doctor on that day (only 'scheduled')
        cursor.execute("""
            SELECT appointment_time FROM appointments
            WHERE doctor_id = %s AND DATE(appointment_time) = %s AND status = 'scheduled';
        """, (doctor_id, date))
        booked = cursor.fetchall()
        booked_slots = [dt[0].strftime("%H:%M") for dt in booked]

        # Final list of available slots excluding booked
        filtered_available_slots = [slot for slot in available_slots if slot not in booked_slots]

        return JSONResponse({
            "doctor_id": doctor_id,
            "appointment_date": date,  # <- updated field name to be more semantic
            "available_slots": filtered_available_slots,
            "booked_slots": booked_slots
        }, status_code=200)

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
