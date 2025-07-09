import requests
import time
import signal
import sys
import os
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Konfigurasi
WEBSITE_URL = os.getenv('TELEGRAM_WEBSITE_URL')
BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')
OLLAMA_URL = 'http://localhost:11435/api/generate'

# Untuk mendeteksi perubahan status
was_down = None

def get_ollama_analysis(error_info):
    try:
        prompt = f"Analyze this website error and provide a brief explanation and possible solution:\n{error_info}"
        payload = {
            "model": "qwen3:0.6b",
            "prompt": prompt,
            "stream": False
        }
        response = requests.post(OLLAMA_URL, json=payload, timeout=30)
        if response.status_code == 200:
            result = response.json()
            return result.get('response', 'No analysis available')
        return f"Failed to get Ollama analysis: Status {response.status_code}"
    except Exception as e:
        return f"Error getting Ollama analysis: {str(e)}"

def send_telegram_message(message):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    data = {
        "chat_id": CHAT_ID,
        "text": message
    }
    try:
        requests.post(url, data=data)
    except Exception as e:
        print("Failed to send Telegram message:", e)

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
        status_info = {
            'status_code': response.status_code,
            'headers': dict(response.headers),
            'response_time': response.elapsed.total_seconds(),
            'content_type': response.headers.get('content-type', 'unknown')
        }
        
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
                
                error_info = {
                    'status': status_desc,
                    'url': WEBSITE_URL,
                    'status_code': status_info['status_code'],
                    'response_time': f"{status_info['response_time']:.2f}s",
                    'error_content': error_content,
                    'headers': dict(response.headers)
                }
                
                # Get analysis from Ollama
                ollama_analysis = get_ollama_analysis(json.dumps(error_info, indent=2))
                
                message = (
                    f"Website Error Detected\n"
                    f"URL: {WEBSITE_URL}\n"
                    f"Status: {status_desc}\n"
                    f"Response Time: {status_info['response_time']:.2f}s\n"
                    f"Content Type: {status_info['content_type']}\n"
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
    print('Press Ctrl+C to stop')
    
    while True:
        try:
            check_website()
            time.sleep(1)
        except Exception as e:
            print(f'Error occurred: {e}')
            time.sleep(1)
