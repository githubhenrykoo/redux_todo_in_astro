import os
import datetime
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import pickle
from dotenv import load_dotenv

load_dotenv()

SCOPES = ['https://www.googleapis.com/auth/calendar']

def get_calendar_service():
    creds = None
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            client_config = {
                "installed": {
                    "client_id": os.getenv("GOOGLE_CALENDAR_CLIENT_ID"),
                    "client_secret": os.getenv("GOOGLE_CALENDAR_CLIENT_SECRET"),
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                    "redirect_uris": ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"]
                }
            }
            flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
            creds = flow.run_local_server(port=0)
        
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)

    return build('calendar', 'v3', credentials=creds)

def list_calendars(service):
    """Lists all available calendars for the authenticated user."""
    calendars_result = service.calendarList().list().execute()
    calendars = calendars_result.get('items', [])

    if not calendars:
        print('No calendars found.')
        return []

    for calendar in calendars:
        summary = calendar['summary']
        calendar_id = calendar['id']
        primary = "Primary" if calendar.get('primary', False) else "Secondary"
        print(f"{summary} ({calendar_id}) - {primary}")
    
    return calendars

def list_events(service, calendar_id='primary', max_results=10, time_min=None):
    """Lists events from a specific calendar."""
    if time_min is None:
        time_min = datetime.datetime.utcnow().isoformat() + 'Z'
    
    events_result = service.events().list(
        calendarId=calendar_id,
        timeMin=time_min,
        maxResults=max_results,
        singleEvents=True,
        orderBy='startTime'
    ).execute()
    
    events = events_result.get('items', [])
    return events

def create_event(service, calendar_id='primary', summary='', location='', description='', 
                start_time=None, end_time=None, attendees=None):
    """Creates a new calendar event."""
    if start_time is None or end_time is None:
        raise ValueError("start_time and end_time are required")

    event = {
        'summary': summary,
        'location': location,
        'description': description,
        'start': {
            'dateTime': start_time,
            'timeZone': 'UTC',
        },
        'end': {
            'dateTime': end_time,
            'timeZone': 'UTC',
        },
    }

    if attendees:
        event['attendees'] = [{'email': email} for email in attendees]

    event = service.events().insert(calendarId=calendar_id, body=event).execute()
    print(f'Event created: {event.get("htmlLink")}')
    return event

def update_event(service, calendar_id='primary', event_id='', summary=None, location=None,
                description=None, start_time=None, end_time=None, attendees=None):
    """Updates an existing calendar event."""
    event = service.events().get(calendarId=calendar_id, eventId=event_id).execute()

    if summary: event['summary'] = summary
    if location: event['location'] = location
    if description: event['description'] = description
    if start_time: event['start']['dateTime'] = start_time
    if end_time: event['end']['dateTime'] = end_time
    if attendees: event['attendees'] = [{'email': email} for email in attendees]

    updated_event = service.events().update(
        calendarId=calendar_id,
        eventId=event_id,
        body=event
    ).execute()
    
    print(f'Event updated: {updated_event.get("htmlLink")}')
    return updated_event

def delete_event(service, calendar_id='primary', event_id=''):
    """Deletes a calendar event."""
    try:
        service.events().delete(calendarId=calendar_id, eventId=event_id).execute()
        print(f'Event {event_id} deleted successfully')
        return True
    except Exception as e:
        print(f'An error occurred: {e}')
        return False

if __name__ == '__main__':
    service = get_calendar_service()
    
    # Example usage:
    print("\nListing calendars:")
    calendars = list_calendars(service)
    
    print("\nListing upcoming events:")
    events = list_events(service, max_results=5)
    for event in events:
        start = event['start'].get('dateTime', event['start'].get('date'))
        print(f"{start} - {event['summary']}")