from google.oauth2 import service_account
from googleapiclient.discovery import build
import os

SCOPES = ['https://www.googleapis.com/auth/calendar']
# SERVICE_ACCOUNT_FILE = os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE")
SERVICE_ACCOUNT_FILE = r"C:\Users\GamMinG\Downloads\voice-233615-48c406a59851.json"

credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES)

calendar_service = build('calendar', 'v3', credentials=credentials)
