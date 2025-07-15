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

# Konfigurasi
WEBSITE_URL = os.getenv('TELEGRAM_WEBSITE_URL')
BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')
OLLAMA_URL = 'http://localhost:11434/api/generate'

# Untuk mendeteksi perubahan status
was_down = None

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
                            welcome_msg = (
                                f"👋 Welcome! I'll notify you about the status of {WEBSITE_URL}\n"
                                "You'll receive notifications when the website goes up or down."
                            )
                            send_telegram_message(welcome_msg, chat_id)
                    last_update_id = update['update_id']
        except Exception as e:
            print(f"Error in Telegram updates handler: {e}")
        time.sleep(1)

def get_ollama_analysis(error_info):
    try:
        # First check if Ollama service is available without sending full request
        try:
            # Quick connection test with a short timeout
            test_response = requests.get(OLLAMA_URL.split('/api/')[0], timeout=1)
        except requests.exceptions.ConnectionError:
            # Ollama server is not running or not accessible
            return "Analysis not available (Ollama service not active)"
        except Exception:
            # Any other error with the test connection, continue with the actual request
            pass
            
        prompt = f"Analyze this website error and provide a brief explanation and possible solution in 1 or 2 important sentences:\n{error_info}"
        payload = {
            "model": "llama3:8b",
            "prompt": prompt,
            "stream": False
        }
        response = requests.post(OLLAMA_URL, json=payload, timeout=30)
        if response.status_code == 200:
            result = response.json()
            return result.get('response', 'No analysis available')
        return f"Analysis not available (status code: {response.status_code})"
    except requests.exceptions.ConnectionError:
        # Handle connection errors specifically
        return "Analysis not available (Ollama service not active)"
    except Exception as e:
        # Handle other errors but with a cleaner message
        return "Analysis not available (error connecting to analysis service)"

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

def check_website():
    global was_down
    try:
        response = requests.get(WEBSITE_URL, timeout=5)
        if response.status_code == 200:
            if was_down is not False:
                message = (
                    f"Website is UP: {WEBSITE_URL}\n"
                )
                send_telegram_message(message)
                print(message)
                was_down = False
        else:
            if was_down is not True:
                error_content = response.text[:500] if response.text else 'No error content'
                status_desc = get_status_description(response.status_code)
                
                # Calculate response time
                response_time = response.elapsed.total_seconds()
                
                error_info = {
                    'status': status_desc,
                    'url': WEBSITE_URL,
                    'status_code': response.status_code,
                    'response_time': f"{response_time:.2f}s",
                    'error_content': error_content,
                    'headers': dict(response.headers)
                }
                
                # Get analysis from Ollama
                ollama_analysis = get_ollama_analysis(json.dumps(error_info, indent=2))
                
                # Get content type from headers if available
                content_type = response.headers.get('content-type', 'Unknown')
                
                message = (
                    f"Website Error Detected\n"
                    f"URL: {WEBSITE_URL}\n"
                    f"Status: {status_desc}\n"
                    f"Response Time: {response_time:.2f}s\n"
                    f"Content Type: {content_type}\n"
                    f"Error Content: {error_content}\n\n"
                    f"Analysis:\n{ollama_analysis}"
                )
                send_telegram_message(message)
                print(message)
                was_down = True
                
    except requests.exceptions.Timeout:
        if was_down is not True:
            error_info = {
                'status': 'TIMEOUT',
                'url': WEBSITE_URL,
                'error': 'Connection timed out after 5 seconds'
            }
            ollama_analysis = get_ollama_analysis(json.dumps(error_info, indent=2))
            
            message = f"Website timeout after 5 seconds: {WEBSITE_URL}\n\nAnalysis:\n{ollama_analysis}"
            send_telegram_message(message)
            print(message)
            was_down = True
            
    except requests.exceptions.ConnectionError as e:
        if was_down is not True:
            error_info = {
                'status': 'CONNECTION_ERROR',
                'url': WEBSITE_URL,
                'error': str(e)
            }
            ollama_analysis = get_ollama_analysis(json.dumps(error_info, indent=2))
            
            message = f"Website is DOWN: {WEBSITE_URL}\n\nAnalysis:\n{ollama_analysis}"
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
            ollama_analysis = get_ollama_analysis(json.dumps(error_info, indent=2))
            
            message = f"Unexpected error: {str(e)}\nWebsite: {WEBSITE_URL}\n\nAnalysis:\n{ollama_analysis}"
            send_telegram_message(message)
            print(message)
            was_down = True

def signal_handler(signum, frame):
    print('\nShutting down...')
    sys.exit(0)

if __name__ == "__main__":
    # Set up signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    
    print(f'Starting website monitoring for {WEBSITE_URL}')
    print(f'Bot token available: {"Yes" if BOT_TOKEN else "No"}')
    print(f'Chat ID from environment: {CHAT_ID if CHAT_ID else "Not set"}')
    print('Press Ctrl+C to stop')
    
    # Start Telegram updates handler in a separate thread
    telegram_thread = Thread(target=handle_telegram_updates, daemon=True)
    telegram_thread.start()
    
    # Send initial startup message
    if BOT_TOKEN and CHAT_ID:
        startup_message = f"🚀 Website monitoring service started for {WEBSITE_URL}"
        send_telegram_message(startup_message, CHAT_ID)
    
    while True:
        try:
            check_website()
            time.sleep(1)
        except Exception as e:
            print(f'Error occurred: {e}')
            time.sleep(3)
