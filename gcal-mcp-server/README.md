# Google Calendar MCP Server

This is a Model Context Protocol (MCP) server that provides integration with Google Calendar. 
It allows LLMs application manage calendar events through a standardized interface.

## Features

- List available calendars
- List events from a calendar
- Create new calendar events
- Update existing events
- Delete events

## Google Cloud Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one.
3. Enable the [Google Calendar API](https://console.cloud.google.com/apis/library/calendar-json.googleapis.com).
4. Create OAuth 2.0 credentials:
   - Go to **Credentials**
   - Click **"Create Credentials" > "OAuth client ID"**
   - Choose **"User data"** as the type of data the app will be accessing.
   - Add your app name and contact information.
   - Add the following scope (optional):
     - `https://www.googleapis.com/auth/calendar.events`
   - Select **"Desktop app"** as the application type.
   - Add your email address as a test user under the [OAuth Consent screen](https://console.cloud.google.com/apis/credentials/consent).
     - **Note:** It may take a few minutes for the test user to propagate.

## Installation


### Steps
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd gcal-mcp-server
   ```
2. Create a virtual environment:
   ```bash
   uv venv
   # On Mac / linux
   source .venv/bin/activate
   # On Windows
   .venv\Scripts\activate
   # Install package in editable mode
   uv pip install -e .
   ```

## Usage

1. Set up the `.env` file with the required environment variables for LLMs.
2. Run the server:
   ```bash
   uv run client.py
   ```

