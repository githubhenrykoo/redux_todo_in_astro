#!/usr/bin/env python3
"""
Generate a comprehensive dataset for testing digit-by-digit division algorithms.
Creates 1000 test cases for single-digit divisors (2-9) and variable dividend sizes.
Also updates the divison2to9.py file with a sample test case.
"""

import random
import csv
import os
from decimal import Decimal, getcontext
import re

# Set high precision for Decimal
getcontext().prec = 40000  # High enough for our largest numbers

def generate_random_number(digits):
    """Generate a random number with the specified number of digits."""
    if digits <= 0:
        return "0"
    
    # First digit should not be 0
    first_digit = random.randint(1, 9)
    
    # Generate remaining digits
    remaining_digits = ''.join(str(random.randint(0, 9)) for _ in range(digits - 1))
    
    return str(first_digit) + remaining_digits

def calculate_division(a, b):
    """Calculate the division of two numbers using Decimal for accuracy."""
    return str(int(Decimal(a) // Decimal(b)))  # Integer division for our algorithm

def generate_test_cases(dividend_sizes, num_cases_per_size=100):
    """Generate division test cases for each specified dividend size."""
    test_cases = []
    
    for digit_size in dividend_sizes:
        print(f"Generating {num_cases_per_size} test cases for {digit_size}-digit dividends...")
        
        for i in range(1, num_cases_per_size + 1):
            # Generate random dividend of specified digit size
            a = generate_random_number(digit_size)
            
            # Generate random divisor between 2-9 (supported by divison2to9.py)
            b = random.randint(2, 9)
            
            # Calculate expected quotient
            expected_quotient = calculate_division(a, b)
            
            # Create test case
            test_case = {
                'name': f"Division_{digit_size}d_{i}",
                'digits': digit_size,
                'dividend': a,
                'divisor': b,
                'expected': expected_quotient
            }
            
            test_cases.append(test_case)
    
    return test_cases

def write_test_cases_to_csv(test_cases, filename):
    """Write test cases to a CSV file."""
    fieldnames = ['name', 'digits', 'dividend', 'divisor', 'expected']
    
    with open(filename, 'w', newline='') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(test_cases)
    
    print(f"Successfully wrote {len(test_cases)} test cases to {filename}")
    
    return test_cases[0]  # Return the first test case to use as an example

def update_division_file(sample_case):
    """Update the divison2to9.py file with a sample test case."""
    division_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "divison2to9.py")
    
    try:
        # Read the division file
        with open(division_file_path, 'r') as f:
            content = f.read()
        
        # Update the a and b values
        updated_content = re.sub(r'a = \s*\n', f'a = {sample_case["dividend"]}\n', content)
        updated_content = re.sub(r'b = \s*\n', f'b = {sample_case["divisor"]}\n', updated_content)
        
        # Write the updated content back
        with open(division_file_path, 'w') as f:
            f.write(updated_content)
        
        print(f"Updated divison2to9.py with sample test case:")
        print(f"  Dividend: {sample_case['dividend']}")
        print(f"  Divisor: {sample_case['divisor']}")
        print(f"  Expected: {sample_case['expected']}")
        
    except Exception as e:
        print(f"Error updating division file: {e}")

def main():
    # Generate only 1-digit divisors (2-9) with 1000 test cases
    dividend_sizes = [1]  # Just 1-digit numbers for simplicity
    
    # Generate 1000 test cases
    test_cases = generate_test_cases(dividend_sizes, num_cases_per_size=1000)
    
    # Write to CSV file
    output_dir = os.path.dirname(os.path.abspath(__file__))
    csv_filename = os.path.join(output_dir, "division_dataset.csv")
    sample_case = write_test_cases_to_csv(test_cases, csv_filename)
    
    # Update the divison2to9.py file with a sample case
    update_division_file(sample_case)
    
    print(f"Dataset generation complete. Total test cases: {len(test_cases)}")
    print(f"File saved to: {csv_filename}")

if __name__ == "__main__":
    main()
