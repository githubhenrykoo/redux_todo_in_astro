import requests
import time
import signal
import sys
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Konfigurasi
WEBSITE_URL = os.getenv('TELEGRAM_WEBSITE_URL')
BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')

# Untuk mendeteksi perubahan status
was_down = None

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

def check_website():
    global was_down
    try:
        response = requests.get(WEBSITE_URL, timeout=5)
        if response.status_code == 200:
            if was_down is not False:
                send_telegram_message(f"Website is UP: {WEBSITE_URL}")
                was_down = False
        else:
            if was_down is not True:
                send_telegram_message(f"Website might be DOWN (status code {response.status_code}): {WEBSITE_URL}")
                was_down = True
    except Exception as e:
        if was_down is not True:
            send_telegram_message(f"Website is DOWN or not reachable: {WEBSITE_URL}")
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
            time.sleep(3)
        except Exception as e:
            print(f'Error occurred: {e}')
            time.sleep(3)
