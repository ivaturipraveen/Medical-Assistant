import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

account_sid = os.getenv('TWILIO_ACCOUNT_SID')
auth_token = os.getenv('TWILIO_AUTH_TOKEN')
messaging_service_sid = os.getenv('TWILIO_MESSAGING_SERVICE_SID')


# Initialize Twilio client
client = Client(account_sid, auth_token)

