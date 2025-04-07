import datetime
import os
import pickle

from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from mcp.server.fastmcp import FastMCP

# Create an MCP server
mcp = FastMCP("Google Calendar")

# Define the scopes required for Google Calendar
SCOPES = ["https://www.googleapis.com/auth/calendar"]
CREDENTIALS_FILE = "credentials.json"
TOKEN_FILE = "token.pickle"

# Global service object
_service = None


def _get_calendar_service():
    """Authenticate and create a Google Calendar API service object

    Returns:
        A Google Calendar API service object
    """
    global _service

    if _service is not None:
        return _service

    creds = None
    # The file token.pickle stores the user's access and refresh tokens
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, "rb") as token:
            creds = pickle.load(token)

    # If there are no valid credentials available, let the user log in
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open(TOKEN_FILE, "wb") as token:
            pickle.dump(creds, token)

    _service = build("calendar", "v3", credentials=creds)
    return _service


@mcp.tool()
def list_calendars():
    """Lists all available calendars for the authenticated user

    Returns:
        str: Formatted string of calendar names and IDs
    """
    service = _get_calendar_service()
    try:
        response = service.calendarList().list().execute()
        calendars = response.get("items", [])

        result = []
        for cal in calendars:
            result.append(f"{cal.get('summary', 'Untitled')} ({cal.get('id', 'no-id')})")

        return "\n".join(result)
    except Exception as error:
        print(f"Error listing calendars: {error}")
        raise error


@mcp.tool()
def list_events(calendar_id: str, time_min: str | None = None, time_max: str | None = None):
    """Lists events from a specific calendar within the given time range

    Args:
        calendar_id: ID of the calendar to list events from
        time_min: Start time in ISO format (default: current time)
        time_max: End time in ISO format (default: 30 days from now)

    Returns:
        str: Formatted string of event details
    """
    service = _get_calendar_service()
    try:
        # Set default time range if not provided
        if not time_min:
            # Using the recommended timezone-aware approach
            time_min = datetime.datetime.now(datetime.UTC).isoformat()
        if not time_max:
            # Default to one month from now
            time_max = (
                datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=30)
            ).isoformat()

        response = (
            service.events()
            .list(
                calendarId=calendar_id,
                timeMin=time_min,
                timeMax=time_max,
                singleEvents=True,
                orderBy="startTime",
            )
            .execute()
        )

        events = response.get("items", [])

        result = []
        for event in events:
            # Process attendees if present
            attendee_list = ""
            if "attendees" in event:
                attendees = [
                    f"{a.get('email', 'no-email')} ({a.get('responseStatus', 'unknown')})"
                    for a in event.get("attendees", [])
                ]
                attendee_list = f"\nAttendees: {', '.join(attendees)}"

            # Process location if present
            location_info = f"\nLocation: {event.get('location')}" if event.get("location") else ""

            # Process start and end times
            start_time = event.get("start", {}).get(
                "dateTime", event.get("start", {}).get("date", "unspecified")
            )
            end_time = event.get("end", {}).get(
                "dateTime", event.get("end", {}).get("date", "unspecified")
            )

            # Format the event information
            event_info = (
                f"{event.get('summary', 'Untitled')} ({event.get('id', 'no-id')})"
                f"{location_info}\n"
                f"Start: {start_time}\n"
                f"End: {end_time}"
                f"{attendee_list}\n"
            )
            result.append(event_info)

        return "\n".join(result)
    except Exception as error:
        print(f"Error listing events: {error}")
        raise error


@mcp.tool()
def create_event(
    calendar_id: str,
    summary: str,
    start: str,
    end: str,
    description: str | None = None,
    location: str | None = None,
    attendees: list[dict[str, str]] | None = None,
):
    """Creates a new event in the specified calendar

    Args:
        calendar_id: ID of the calendar to create the event in
        summary: Title of the event
        start: Start time in ISO format
        end: End time in ISO format
        description: Optional description of the event
        location: Optional location of the event
        attendees: Optional list of attendees [{email: 'example@example.com'}, ...]

    Returns:
        str: Confirmation message with event details
    """
    service = _get_calendar_service()
    try:
        event_body = {"summary": summary, "start": {"dateTime": start}, "end": {"dateTime": end}}

        # Add optional fields if provided
        if description:
            event_body["description"] = description
        if location:
            event_body["location"] = location
        if attendees:
            event_body["attendees"] = attendees

        event = service.events().insert(calendarId=calendar_id, body=event_body).execute()

        return f"Event created: {event.get('summary')} ({event.get('id')})"
    except Exception as error:
        print(f"Error creating event: {error}")
        raise error


@mcp.tool()
def update_event(
    calendar_id: str,
    event_id: str,
    summary: str | None = None,
    description: str | None = None,
    start: str | None = None,
    end: str | None = None,
    location: str | None = None,
    attendees: list[dict[str, str]] | None = None,
):
    """Updates an existing event in the specified calendar

    Args:
        calendar_id: ID of the calendar containing the event
        event_id: ID of the event to update
        summary: Optional new title for the event
        description: Optional new description
        start: Optional new start time in ISO format
        end: Optional new end time in ISO format
        location: Optional new location
        attendees: Optional new list of attendees

    Returns:
        str: Confirmation message with updated event details
    """
    service = _get_calendar_service()
    try:
        # Build event body with only the fields that need to be updated
        event_body = {}

        if summary:
            event_body["summary"] = summary
        if description:
            event_body["description"] = description
        if start:
            event_body["start"] = {"dateTime": start}
        if end:
            event_body["end"] = {"dateTime": end}
        if location:
            event_body["location"] = location
        if attendees:
            event_body["attendees"] = attendees

        event = (
            service.events()
            .patch(calendarId=calendar_id, eventId=event_id, body=event_body)
            .execute()
        )

        return f"Event updated: {event.get('summary')} ({event.get('id')})"
    except Exception as error:
        print(f"Error updating event: {error}")
        raise error


@mcp.tool()
def delete_event(calendar_id: str, event_id: str):
    """Deletes an event from the specified calendar

    Args:
        calendar_id: ID of the calendar containing the event
        event_id: ID of the event to delete

    Returns:
        str: Confirmation message
    """
    service = _get_calendar_service()
    try:
        service.events().delete(calendarId=calendar_id, eventId=event_id).execute()

        return "Event deleted successfully"
    except Exception as error:
        print(f"Error deleting event: {error}")
        raise error


# Example usage
if __name__ == "__main__":
    # Example: List all calendars
    print("Your calendars:")
    print(list_calendars())

    # Example: List upcoming events from primary calendar
    print("\nUpcoming events:")
    print(list_events("primary"))

    tomorrow = datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=1)
    start_time = tomorrow.replace(hour=10, minute=0, second=0).isoformat()
    end_time = tomorrow.replace(hour=11, minute=0, second=0).isoformat()

    result = create_event(
        calendar_id="primary",  # Using primary calendar
        summary="Test Meeting",
        start=start_time,
        end=end_time,
        description="This is a test event created via the Google Calendar API",
        location="Meeting Room A",
        attendees=[
            {"email": "your-email@example.com"}  # Replace with a real email
        ],
    )
    print(result)


# if __name__ == "__main__":
#     mcp.run(transport="sse")
