#!/bin/bash
# Simple script to run the Python transcription script

# Change to the correct directory
cd "$(dirname "$0")/Docs/to-do-plan"

# Activate virtual environment and run the script
source venv/bin/activate && python generator/audio_transcriber.py
