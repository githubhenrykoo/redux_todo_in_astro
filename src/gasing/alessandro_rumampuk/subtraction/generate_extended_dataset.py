#!/usr/bin/env python3
"""
Generate a comprehensive dataset for testing large number addition algorithms.
Creates 100 test cases for each of the specified digit sizes.
"""

import random
import csv
import os
from decimal import Decimal, getcontext

# Set very high precision for Decimal
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

def calculate_sum(a, b):
    """Calculate the sum of two large numbers using Decimal for accuracy."""
    return str(Decimal(a) + Decimal(b))

def generate_test_cases(digit_sizes, num_cases_per_size=100):
    """Generate test cases for each specified digit size."""
    test_cases = []
    
    for digit_size in digit_sizes:
        print(f"Generating {num_cases_per_size} test cases for {digit_size}-digit numbers...")
        
        for i in range(1, num_cases_per_size + 1):
            # Generate two random numbers of specified digit size
            a = generate_random_number(digit_size)
            b = generate_random_number(digit_size)
            
            # Calculate expected sum
            expected_sum = calculate_sum(a, b)
            
            # Create test case
            test_case = {
                'name': f"Random_{digit_size}d_{i}",
                'digits': digit_size,
                'a': a,
                'b': b,
                'expected': expected_sum
            }
            
            test_cases.append(test_case)
    
    return test_cases

def write_test_cases_to_csv(test_cases, filename):
    """Write test cases to a CSV file."""
    fieldnames = ['name', 'digits', 'a', 'b', 'expected']
    
    with open(filename, 'w', newline='') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(test_cases)
    
    print(f"Successfully wrote {len(test_cases)} test cases to {filename}")

def main():
    # Define digit sizes we want to test
    digit_sizes = [1, 5, 10, 50, 100, 500, 1000, 4000, 8000, 16000, 32000]
    
    # Generate test cases
    test_cases = generate_test_cases(digit_sizes)
    
    # Write to CSV file
    output_dir = os.path.dirname(os.path.abspath(__file__))
    csv_filename = os.path.join(output_dir, "extended_subtraction_dataset.csv")
    write_test_cases_to_csv(test_cases, csv_filename)
    
    print(f"Dataset generation complete. Total test cases: {len(test_cases)}")
    print(f"File saved to: {csv_filename}")

if __name__ == "__main__":
    main()
