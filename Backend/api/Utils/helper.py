import re
import difflib
import phonenumbers
from dateutil.parser import parse as parse_datetime
from datetime import datetime,timedelta,time,date
from Google_calender import calendar_service
import calendar


def format_phone(raw_phone: str) -> str:
    """
    Normalize various phone number formats into E.164.
    If parsing fails or is missing, returns empty string.
    """
    if not raw_phone:
        return ""
    raw = re.sub(r"[^+0-9]", "", raw_phone)
    try:
        parsed = phonenumbers.parse(raw, "IN")
        if phonenumbers.is_valid_number(parsed):
            return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
    except phonenumbers.NumberParseException:
        pass
    return ""

def normalize_time_str(tstr: str) -> str:
    """
    1) strip whitespace
    2) change dots to colons (e.g. "2.30" -> "2:30")
    3) if it's just hour digits, add ":00"
    4) ensure am/pm suffix stays attached
    """
    t = tstr.strip().lower()
    # separate out am/pm
    match = re.match(r"^(.+?)(am|pm)$", t)
    suffix = ""
    if match:
        t, suffix = match.group(1), match.group(2)
    # dots → colons
    t = t.replace(".", ":")
    # if just digits like "2" or "14", add ":00"
    if re.fullmatch(r"\d{1,2}", t):
        t += ":00"
    return t + suffix

def parse_time_input(tstr: str) -> time:
    """
    Normalize and parse a time string into datetime.time.
    Raises ValueError if still unparseable.
    """
    norm = normalize_time_str(tstr)
    try:
        return parse_datetime(norm).time()
    except Exception:
        raise ValueError(
            "Invalid time format. Use something like '2', '2pm', '2.30', '2.30pm', '14:00', etc."
        )

def parse_window(win: str) -> tuple[time, time]:
    """Parse a time window string into start and end times."""
    start_str, end_str = [p.strip() for p in win.split("-")]
    start = datetime.strptime(start_str, "%I:%M %p").time()
    end   = datetime.strptime(end_str,   "%I:%M %p").time()
    return start, end

def normalize_name(name: str) -> str:
    """Remove common titles and punctuation, lowercase, remove non-letters."""
    name = re.sub(r"\b(dr|doctor|mr|mrs|ms|miss|prof)\b", "", name, flags=re.I)
    name = re.sub(r"[^a-z]", "", name.lower())
    return name

def split_time_range(time_range: str) -> list[str]:
    """Split a time range into 30-minute intervals."""
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
            interval_str = f"{start_time.strftime('%I:%M %p')} "
            intervals.append(interval_str)
            start_time = next_time

        return intervals
    except Exception as e:
        raise ValueError(f"Invalid time format: {e}")

def find_doctor_by_name(cursor, input_name: str):
    """Find a doctor by name using flexible matching."""
    norm_input = normalize_name(input_name)

    # Fetch all doctors
    cursor.execute("SELECT name, department FROM doctors;")
    doctors = cursor.fetchall()

    # Build normalized map
    norm_map = {normalize_name(name): (name, None, department) 
                for name, department in doctors}

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

def parse_date(dob_str: str) -> date:
    """Parse various date formats into a date object."""
    def parse_month(m_str):
        try:
            num = int(m_str)
            if 1 <= num <= 12:
                return num
        except ValueError:
            m_str = m_str.lower()
            for i, name in enumerate(calendar.month_name[1:], 1):
                if m_str in name.lower(): return i
            for i, abbr in enumerate(calendar.month_abbr[1:], 1):
                if m_str in abbr.lower(): return i
        return None

    def clean_date(s):
        s = s.lower().replace(',', ' ')
        for suf in ['st','nd','rd','th']:
            s = s.replace(suf, '')
        # Handle dates without spaces (e.g., "31may")
        if not any(c.isspace() for c in s):
            # Try to split at the boundary between digits and letters
            match = re.match(r'(\d+)([a-zA-Z]+)', s)
            if match:
                day, month = match.groups()
                s = f"{month} {day}"
        return ' '.join(s.split())

    s = clean_date(dob_str)
    parts = s.split()
    
    # If only month and day are provided, use current year
    if len(parts) == 2:
        mo = parse_month(parts[0])
        if mo and parts[1].isdigit():
            day = int(parts[1])
            if 1 <= day <= 31:
                current_year = datetime.now().year
                return datetime.strptime(f"{current_year}/{mo:02d}/{day:02d}", "%Y/%m/%d").date()
    
    # Year-only
    if len(parts)==1 and parts[0].isdigit() and len(parts[0])==4:
        return datetime.strptime(f"{parts[0]}/01/01", "%Y/%m/%d").date()
    
    # Try combinations
    for i in range(len(parts)):
        # year first
        if parts[i].isdigit() and len(parts[i])==4:
            year = parts[i]
            rem = parts[:i]+parts[i+1:]
            for p in rem:
                mo = parse_month(p)
                if mo:
                    days = [int(x) for x in rem if x.isdigit() and len(x)<=2]
                    if days:
                        return datetime.strptime(f"{year}/{mo:02d}/{days[0]:02d}", "%Y/%m/%d").date()
        # month first
        mo = parse_month(parts[i])
        if mo:
            days = [int(x) for x in parts if x.isdigit() and len(x)<=2]
            yrs = [x for x in parts if x.isdigit() and len(x)==4]
            if days:
                year = yrs[0] if yrs else datetime.now().year
                return datetime.strptime(f"{year}/{mo:02d}/{days[0]:02d}", "%Y/%m/%d").date()
        # day first
        if parts[i].isdigit() and len(parts[i])<=2:
            day = int(parts[i])
            for p in parts:
                mo = parse_month(p)
                if mo:
                    yrs = [x for x in parts if x.isdigit() and len(x)==4]
                    year = yrs[0] if yrs else datetime.now().year
                    return datetime.strptime(f"{year}/{mo:02d}/{day:02d}", "%Y/%m/%d").date()
    
    # Try standard formats
    for fmt in ["%Y-%m-%d", "%Y%m%d", "%Y/%m/%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%y", "%d/%m/%y"]:
        try:
            return datetime.strptime(dob_str, fmt).date()
        except ValueError:
            continue
    
    return None

def create_calendar_event(doctor_calendar_id, patient_name, appointment_datetime, duration_minutes=30):
    event = {
        'summary': f'Appointment with {patient_name}',
        'start': {
            'dateTime': appointment_datetime.isoformat(),
            'timeZone': 'EST',
        },
        'end': {
            'dateTime': (appointment_datetime + timedelta(minutes=duration_minutes)).isoformat(),
            'timeZone': 'EST',
        },
        'reminders': {
            'useDefault': False,
            'overrides': [
                {'method': 'email', 'minutes': 24 * 60},
                {'method': 'popup', 'minutes': 10},
            ],
        },
    }

    event_result = calendar_service.events().insert(
        calendarId=doctor_calendar_id,
        body=event
    ).execute()

    return event_result.get('id')
    
def update_calendar_event(event_id, calendar_id, title, new_datetime, duration_minutes=30):
    event = calendar_service.events().get(calendarId=calendar_id, eventId=event_id).execute()
    event['start'] = {'dateTime': new_datetime.isoformat(), 'timeZone': 'EST'}
    end_dt = new_datetime + timedelta(minutes=duration_minutes)
    event['end']   = {'dateTime': end_dt.isoformat(),   'timeZone': 'EST'}
    updated = calendar_service.events().patch(
        calendarId=calendar_id,
        eventId=event_id,
        body=event
    ).execute()
    return updated['id']
