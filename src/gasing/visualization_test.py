#!/usr/bin/env python3
"""
Visualization Test Script

This script demonstrates various Python features for testing output formatting
in the Python script execution panel.
"""

import time
from datetime import datetime


def print_colored_text():
    """Print text with ANSI color codes to test color handling."""
    print("\033[1;32mGreen Bold Text\033[0m")
    print("\033[1;31mRed Bold Text\033[0m")
    print("\033[1;34mBlue Bold Text\033[0m")
    print("\033[1;33mYellow Bold Text\033[0m")


def print_data_structures():
    """Print various Python data structures to test formatting."""
    # Dictionary
    person = {
        "name": "Test User",
        "age": 30,
        "skills": ["Python", "JavaScript", "React"],
        "contact": {
            "email": "test@example.com",
            "phone": "555-1234"
        }
    }
    print(f"Dictionary: {person}")
    
    # List comprehension
    squares = [x**2 for x in range(1, 11)]
    print(f"List comprehension result: {squares}")
    
    # Set
    unique_letters = set("abracadabra")
    print(f"Set from string: {unique_letters}")
    
    # Tuple
    coordinates = [(x, y) for x in range(3) for y in range(3)]
    print(f"List of tuples: {coordinates}")


def interactive_demo():
    """Simulate an interactive application with progress indicators."""
    print("Starting processing...")
    
    for i in range(5):
        print(f"Processing batch {i+1}/5...")
        # Simulate work
        time.sleep(0.5)
        print(f"Batch {i+1} complete! ✓")
    
    print("\nFinal Results:")
    print("┌─────────────────────────────┐")
    print("│ Processing complete!        │")
    print("│ • All batches processed     │")
    print("│ • No errors detected        │")
    print("│ • Execution time: 2.5s      │")
    print("└─────────────────────────────┘")


def main():
    """Main function to run all demos."""
    print(f"Test script running at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("\n=== Color Test ===")
    print_colored_text()
    
    print("\n=== Data Structures Test ===")
    print_data_structures()
    
    print("\n=== Interactive Test ===")
    interactive_demo()
    
    print("\nAll tests completed successfully! 🎉")


if __name__ == "__main__":
    main()
