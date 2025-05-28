from twilio.rest import Client
import os
from dotenv import load_dotenv

load_dotenv()

client = Client(
    os.environ['TWILIO_ACCOUNT_SID'],
    os.environ['TWILIO_AUTH_TOKEN']
)
if(client):
    print("established..sending a message")

client.messages.create(
    messaging_service_sid=os.environ['TWILIO_MESSAGING_SERVICE_SID'],
    to='+1',
    body=''
)
