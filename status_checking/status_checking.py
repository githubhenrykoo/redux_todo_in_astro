import requests
import time
import signal
import sys
import os
import json
from dotenv import load_dotenv
from threading import Thread

# Load environment variables from .env file
load_dotenv()

# Get configuration from environment variables
WEBSITES = os.getenv('MONITORED_WEBSITES', '').split(',')
BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')
# Validate required environment variables
if not BOT_TOKEN:
    raise ValueError("TELEGRAM_BOT_TOKEN environment variable is required")
if not WEBSITES or not any(WEBSITES):
    raise ValueError("MONITORED_WEBSITES environment variable is required with at least one URL")

# Track status for each domain
website_status = {url.strip(): None for url in WEBSITES if url.strip()}

# Store active chat IDs
active_chats = set()

# Initialize active_chats with the CHAT_ID from environment if available
if CHAT_ID:
    active_chats.add(CHAT_ID)
    print(f"Added chat ID from environment: {CHAT_ID}")

def handle_telegram_updates():
    last_update_id = 0
    while True:
        try:
            url = f"https://api.telegram.org/bot{BOT_TOKEN}/getUpdates"
            params = {
                'offset': last_update_id + 1,
                'timeout': 30
            }
            response = requests.get(url, params=params, timeout=35)
            updates = response.json()
            
            if updates.get('ok') and updates.get('result'):
                for update in updates['result']:
                    if 'message' in update:
                        chat_id = update['message']['chat']['id']
                        active_chats.add(chat_id)
                        # Send welcome message
                        if update['message'].get('text') == '/start':
                            websites_list = "\n- " + "\n- ".join(WEBSITES)
                            welcome_msg = (
                                "👋 Welcome! I'll monitor the following websites:\n"
                                f"{websites_list}\n\n"
                                "You'll receive notifications when any website goes up or down."
                            )
                            send_telegram_message(welcome_msg, chat_id)
                    last_update_id = update['update_id']
        except Exception as e:
            print(f"Error in Telegram updates handler: {e}")
        time.sleep(1)

def send_telegram_message(message, chat_id=None):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    
    if chat_id:
        # Send to specific chat ID
        data = {
            "chat_id": chat_id,
            "text": message
        }
        try:
            response = requests.post(url, data=data)
            print(f"Telegram API response: {response.status_code} - {response.text[:100]}")
        except Exception as e:
            print(f"Failed to send Telegram message to {chat_id}:", e)
    elif active_chats:
        # Broadcast to all active chats
        print(f"Sending message to {len(active_chats)} active chats")
        for chat_id in active_chats:
            data = {
                "chat_id": chat_id,
                "text": message
            }
            try:
                response = requests.post(url, data=data)
                print(f"Telegram API response for {chat_id}: {response.status_code} - {response.text[:100]}")
            except Exception as e:
                print(f"Failed to send Telegram message to {chat_id}:", e)
    else:
        # Fallback to CHAT_ID from environment if no active chats
        if CHAT_ID:
            data = {
                "chat_id": CHAT_ID,
                "text": message
            }
            try:
                response = requests.post(url, data=data)
                print(f"Telegram API response using env CHAT_ID: {response.status_code} - {response.text[:100]}")
            except Exception as e:
                print(f"Failed to send Telegram message to CHAT_ID from env:", e)
        else:
            print("No chat IDs available to send message to. Message not sent.")

def get_status_description(status_code):
    status_codes = {
        400: "Bad Request - The server cannot process the request due to client error",
        401: "Unauthorized - Authentication is required",
        403: "Forbidden - Server refuses to authorize the request",
        404: "Not Found - The requested resource could not be found",
        500: "Internal Server Error - The server encountered an unexpected condition",
        502: "Bad Gateway - The server received an invalid response from upstream",
        503: "Service Unavailable - The server is temporarily unable to handle the request",
        504: "Gateway Timeout - The upstream server failed to send a request in time"
    }
    return status_codes.get(status_code, f"HTTP {status_code} - Unknown Status Code")

def check_website(url):
    global website_status
    try:
        start_time = time.time()
        response = requests.get(url, timeout=5, allow_redirects=True)
        response_time = time.time() - start_time
        
        if response.status_code == 200:
            if website_status[url] != 'up':
                message = (
                    f"✅ Website is UP: {url}\n"
                    f"Response Time: {response_time:.2f}s"
                )
                send_telegram_message(message)
                print(message)
                website_status[url] = 'up'
        else:
            if website_status[url] != 'down':
                error_content = response.text[:500] if response.text else 'No error content'
                status_desc = get_status_description(response.status_code)
                
                error_info = {
                    'status': status_desc,
                    'url': url,
                    'status_code': response.status_code,
                    'response_time': f"{response_time:.2f}s",
                    'error_content': error_content,
                    'headers': dict(response.headers)
                }
                
                # Get content type from headers if available
                content_type = response.headers.get('content-type', 'Unknown')
                
                message = (
                    f"❌ Website Error Detected\n"
                    f"URL: {url}\n"
                    f"Status: {status_desc}\n"
                    f"Response Time: {response_time:.2f}s\n"
                    f"Content Type: {content_type}\n"
                    f"Error Content: {error_content}"
                )
                send_telegram_message(message)
                print(message)
                website_status[url] = 'down'
    
    except requests.exceptions.RequestException as e:
        if website_status[url] != 'error':
            error_info = {
                'url': url,
                'error': str(e),
                'type': type(e).__name__
            }
            message = (
                f"❌ Connection Error\n"
                f"URL: {url}\n"
                f"Error: {str(e)}\n"
                f"Type: {type(e).__name__}"
            )
            send_telegram_message(message)
            print(message)
            website_status[url] = 'error'
                
    except requests.exceptions.Timeout:
        if was_down is not True:
            error_info = {
                'status': 'TIMEOUT',
                'url': WEBSITE_URL,
                'error': 'Connection timed out after 5 seconds'
            }
            message = f"Website timeout after 5 seconds: {url}"
            send_telegram_message(message)
            print(message)
            was_down = True
            
    except requests.exceptions.ConnectionError as e:
        if was_down is not True:
            error_info = {
                'status': 'CONNECTION_ERROR',
                'url': url,
                'error': str(e)
            }
            message = f"❌ Website is DOWN: {url}\nError: {str(e)}"
            send_telegram_message(message)
            print(message)
            was_down = True
            
    except Exception as e:
        if was_down is not True:
            error_info = {
                'status': 'UNEXPECTED_ERROR',
                'url': WEBSITE_URL,
                'error': str(e)
            }
            message = f"Unexpected error: {str(e)}\nWebsite: {url}"
            send_telegram_message(message)
            print(message)
            was_down = True

def signal_handler(signum, frame):
    print('\nShutting down...')
    sys.exit(0)

def main():
    if not website_status:
        print("No websites to monitor. Please set MONITORED_WEBSITES environment variable.")
        print("Example: export MONITORED_WEBSITES=\"https://example1.com,https://example2.com\"")
        return
        
    print(f"Starting website monitoring for {len(website_status)} websites:")
    for url in website_status:
        print(f"- {url}")
    
    # Start the Telegram updates handler in a separate thread
    telegram_thread = Thread(target=handle_telegram_updates)
    telegram_thread.daemon = True
    telegram_thread.start()
    
    while True:
        try:
            for url in list(website_status.keys()):
                check_website(url)
                time.sleep(5)  # Small delay between checking different websites
            time.sleep(60)  # Check all websites every minute
        except Exception as e:
            print(f'Error occurred: {e}')
            time.sleep(3)

if __name__ == "__main__":
    main()
