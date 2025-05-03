#!/usr/bin/env python3
"""
A simple Hello World script for testing the Python script execution panel.
No input required - runs automatically.
"""

def main():
    """Print a friendly greeting to the world."""
    print("Hello, World!")
    
    # Using a predefined name instead of input
    name = "Python User"
    print(f"Nice to meet you, {name}!")
    
    # Add some formatting to test terminal output
    print("\nHere's a small countdown:")
    for i in range(5, 0, -1):
        print(f"  {i}...")
    
    print("Blast off! 🚀")

if __name__ == "__main__":
    main()

    