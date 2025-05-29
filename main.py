from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
import re
import time
import difflib
import json
from datetime import datetime,timedelta
import calendar

app = FastAPI()

origins = [
    "http://localhost:5174",
    "http://localhost:5173",  # Added common dev port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,           
    allow_credentials=True,
    allow_methods=["*"],              
    allow_headers=["*"],              
)

def get_db_connection():
    try:
        print("Attempting to connect to database...")
        conn = psycopg2.connect(
            user="postgres",
            password="Yanthraa123",
            host="medicaldb-instance-1.c38m48coaic4.us-east-1.rds.amazonaws.com",
            port=5432,
            database="medicaldb"
        )
        print("Database connection successful")
        return conn
    except Exception as e:
        print(f"Database connection error: {str(e)}")
        return None
    
conn = get_db_connection()
cursor = conn.cursor()

def format_email(email):
    if not email:
        return "temp@gmail.com"
    email = email.strip()
    if "@" not in email:
        email = f"{email}@gmail.com"
    return email




    
def split_time_range(time_range: str):
    try:
        # Clean and split the time string
        start_str, end_str = [t.strip().upper().replace(" ", "") for t in time_range.split("-")]

        # Parse time to datetime objects
        start_time = datetime.strptime(start_str, "%I:%M%p")
        end_time = datetime.strptime(end_str, "%I:%M%p")

        # Generate 30-minute slots
        intervals = []
        while start_time < end_time:
            next_time = start_time + timedelta(minutes=30)
            interval_str = f"{start_time.strftime('%I:%M %p')} - {next_time.strftime('%I:%M %p')}"
            intervals.append(interval_str)
            start_time = next_time

        return intervals
    except Exception as e: 
        raise ValueError(f"Invalid time format: {e}")

@app.post("/time-slot")
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
    
def parse_window(win: str) -> tuple[time, time]:
    start_str, end_str = [p.strip() for p in win.split("-")]
    start = datetime.strptime(start_str, "%I:%M %p").time()
    end   = datetime.strptime(end_str,   "%I:%M %p").time()
    return start, end

def normalize_name(name: str) -> str:
    # Remove common titles and punctuation, lowercase, remove non-letters
    # Customize titles to remove as needed
    name = re.sub(r"\b(dr|doctor|mr|mrs|ms|miss|prof)\b", "", name, flags=re.I)
    name = re.sub(r"[^a-z]", "", name.lower())
    return name

def find_doctor_by_name(cursor, input_name: str):
    norm_input = normalize_name(input_name)

    # Fetch all doctors
    cursor.execute("SELECT name, available_timings, department FROM doctors;")
    doctors = cursor.fetchall()

    # Build normalized map
    norm_map = {normalize_name(name): (name, available_timings, department) for name, available_timings, department in doctors}

    # 1) Exact normalized match
    if norm_input in norm_map:
        return norm_map[norm_input]

    # 2) Substring match
    for key, val in norm_map.items():
        if norm_input and norm_input in key:
            return val

    # 3) Fuzzy match fallback
    choices = list(norm_map.keys())
    fuzzy = difflib.get_close_matches(norm_input, choices, n=1, cutoff=0.5)
    if fuzzy:
        return norm_map[fuzzy[0]]

    return None




# 1. Categories endpoint
@app.get('/categories')
def get_categories():
    cursor.execute("SELECT DISTINCT department FROM doctors;")
    cats = [row[0] for row in cursor.fetchall()]
    return {'categories': cats}

# 2. Doctors endpoint
@app.get('/doctors')
async def get_doctors():
    try:
        print("Fetching doctors...")
        print("Executing doctors query...")
        cursor.execute("""
            SELECT 
                id, 
                name, 
                department
            FROM doctors 
            ORDER BY department, name;
        """)
        rows = cursor.fetchall()
        print(f"Found {len(rows)} doctors")

        return {
            'doctors': [
                {
                    'id': row[0],
                    'name': row[1],
                    'department': row[2]
                }
                for row in rows
            ]
        }
    except Exception as e:
        print("Error fetching doctors:", str(e))
        return JSONResponse(
            content={"error": f"Failed to fetch doctors: {str(e)}"},
            status_code=500
        )

@app.get("/patients/count")
async def get_patients_count():
    try:
        cursor.execute("SELECT COUNT(*) FROM patients;")
        count = cursor.fetchone()[0]
        return JSONResponse(content={"patients_count": count})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
@app.get('/appointments')
async def get_appointments(doctor_id: int = None):
    try:
        
        if doctor_id:
            # If doctor_id is provided, filter by it
            cursor.execute("""
                SELECT
                    a.id,
                    a.appointment_time,
                    a.patient_id,
                    p.full_name as patient_name,
                    d.name as doctor_name,
                    d.department
                FROM appointments a
                JOIN patients p ON a.patient_id = p.id
                JOIN doctors d ON a.doctor_id = d.id
                WHERE a.doctor_id = %s
                ORDER BY a.appointment_time;
            """, (doctor_id,))
        else:
            # If no doctor_id, fetch all appointments
            cursor.execute("""
                SELECT
                    a.id,
                    a.appointment_time,
                    a.patient_id,
                    p.full_name as patient_name,
                    d.name as doctor_name,
                    d.department
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
                    'department': r[5]
                }
                for r in rows
            ]
        }
    except Exception as e:
        print("Error fetching appointments:", str(e))
        return JSONResponse(
            content={"error": f"Failed to fetch appointments: {str(e)}"},
            status_code=500
        )

@app.get('/patients')
async def get_patients():
    try:
        print("Fetching patients...")
        print("Executing patients query...")
        cursor.execute("""
            SELECT 
                p.id, 
                p.full_name, 
                p.dob, 
                p.phone_number,
                p.status,
                p.doctor_id,
                d.department
            FROM patients p
            LEFT JOIN doctors d ON p.doctor_id = d.id
            ORDER BY p.id;
        """)
        rows = cursor.fetchall()
        print(f"Found {len(rows)} patients")

        return {
            'patients': [
                {
                    'id': row[0],
                    'full_name': row[1],
                    'dob': row[2].strftime('%Y-%m-%d') if row[2] else None,
                    'phone_number': row[3] if row[3] else 'Not provided',
                    'status': row[4] if row[4] else 'active',
                    'doctor_id': row[5],
                    'department': row[6] if row[6] else 'Not assigned'
                }
                for row in rows
            ]
        }
    except Exception as e:
        print("Error fetching patients:", str(e))
        return JSONResponse(
            content={"error": f"Failed to fetch patients: {str(e)}"},
            status_code=500
        )

# Dashboard statistics endpoint
@app.get('/dashboard/stats')
async def get_dashboard_stats():
    try:
        print("Fetching dashboard statistics...")

        
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
                'total_doctors': total_doctors,
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

# Additional Dashboard Statistics Endpoints
@app.get('/dashboard/appointments-by-department')
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

@app.get('/dashboard/patient-growth')
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

@app.get('/dashboard/weekly-distribution')
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

@app.get('/dashboard/doctor-workload')
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

@app.get('/dashboard/age-distribution')
async def get_age_distribution():
    try:
            
        cursor.execute("""
            SELECT 
                CASE 
                    WHEN age < 18 THEN '0-17'
                    WHEN age BETWEEN 18 AND 30 THEN '18-30'
                    WHEN age BETWEEN 31 AND 50 THEN '31-50'
                    WHEN age BETWEEN 51 AND 70 THEN '51-70'
                    ELSE '70+'
                END as age_group,
                COUNT(*) as patient_count
            FROM (
                SELECT 
                    EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob)) as age
                FROM patients
            ) age_calc
            GROUP BY age_group
            ORDER BY age_group;
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