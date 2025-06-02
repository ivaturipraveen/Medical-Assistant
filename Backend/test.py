import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

account_sid = os.getenv('TWILIO_ACCOUNT_SID')
auth_token = os.getenv('TWILIO_AUTH_TOKEN')
messaging_service_sid = os.getenv('TWILIO_MESSAGING_SERVICE_SID')

# Check for missing credentials
if not all([account_sid, auth_token, messaging_service_sid]):
    print("Error: One or more Twilio credentials are missing in environment variables.")
    exit(1)

# Input recipient and message
to_number = input("Enter the recipient's phone number (e.g., +11234567890): ")
message_body = input("Enter the message you want to send: ")

# Initialize Twilio client
client = Client(account_sid, auth_token)

try:
    message = client.messages.create(
        to=to_number,
        from_="medical appointment",
        body=message_body,
        messaging_service_sid=messaging_service_sid
    )
    print(f"✅ Message sent successfully. SID: {message.sid}")
except Exception as e:
    print(f"❌ Failed to send message: {e}")
