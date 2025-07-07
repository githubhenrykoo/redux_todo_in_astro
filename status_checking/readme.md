# Website Status Monitoring Tool

A Python script that monitors a website's availability and sends notifications through Telegram when the status changes.

## Features

- Continuous website monitoring
- Telegram notifications for status changes
- Environment variables configuration
- Graceful shutdown with Ctrl+C

## Prerequisites

- Python 3.x
- pip (Python package installer)

## Installation

1. Clone this repository or download the script
2. Install required dependencies:
```bash
pip install requests python-dotenv
```

## Configuration

1. Create a `.env` file in the same directory as the script with the following variables:
```
TELEGRAM_WEBSITE_URL=https://your-website-url.com
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
```

### Getting Telegram Credentials

1. Create a Telegram bot:
   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Use the `/newbot` command and follow instructions
   - Save the bot token provided

2. Get your Chat ID:
   - Message your bot
   - Visit: `https://api.telegram.org/bot<YourBOTToken>/getUpdates`
   - Look for the "chat" -> "id" field in the response

## Usage

Run the script:
```bash
python status_checking.py
```

The script will:
- Monitor the specified website every 3 seconds
- Send Telegram notifications when the website status changes
- Display monitoring status in the console
- Can be stopped with Ctrl+C
