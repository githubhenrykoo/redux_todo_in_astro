#!/usr/bin/env python3
"""
Generate a comprehensive dataset with 1 million 5-digit subtraction problems.
Optimized for generating and storing a large number of small subtraction problems.
"""

import random
import csv
import os
import time
from decimal import Decimal

def generate_random_5digit_number():
    """Generate a random 5-digit number (10000-99999)."""
    return str(random.randint(10000, 99999))

def calculate_difference(a, b, allow_negative=True):
    """
    Calculate the difference a-b of two numbers.
    
    Args:
        a: First number as string
        b: Second number as string
        allow_negative: Whether to allow negative results
    
    Returns:
        The difference as a string, optionally with a minus sign
    """
    # Convert to integers for 5-digit numbers (much faster than Decimal)
    a_val = int(a)
    b_val = int(b)
    
    if not allow_negative and a_val < b_val:
        # Swap to ensure positive result
        return str(b_val - a_val)
    
    return str(a_val - b_val)

def generate_subtraction_cases(num_cases, include_negative=True, batch_size=10000):
    """
    Generate specified number of subtraction test cases.
    
    Args:
        num_cases: Number of test cases to generate
        include_negative: Whether to allow negative results
        batch_size: How many cases to process in each batch for memory efficiency
    
    Returns:
        Generator yielding batches of test cases
    """
    cases_generated = 0
    batch_num = 1
    
    while cases_generated < num_cases:
        current_batch_size = min(batch_size, num_cases - cases_generated)
        print(f"Generating batch {batch_num}: {current_batch_size} subtraction cases...")
        
        batch = []
        for i in range(current_batch_size):
            # Generate two random 5-digit numbers
            a = generate_random_5digit_number()
            b = generate_random_5digit_number()
            
            # Ensure we have an even mix of negative and positive results
            if include_negative and i % 2 == 0:
                # Force negative result by ensuring b > a
                if int(a) > int(b):
                    a, b = b, a
            elif not include_negative:
                # Ensure positive result by swapping if needed
                if int(a) < int(b):
                    a, b = b, a
            
            # Calculate expected difference
            expected_diff = calculate_difference(a, b, include_negative)
            
            # Create test case
            case_id = cases_generated + i + 1
            test_case = {
                'name': f"Sub_5d_{case_id}",
                'digits': 5,
                'a': a,
                'b': b,
                'expected': expected_diff
            }
            
            batch.append(test_case)
        
        yield batch
        
        cases_generated += current_batch_size
        batch_num += 1

def write_batches_to_csv(generator, filename, total_cases):
    """Write batches of test cases to a CSV file with progress tracking."""
    fieldnames = ['name', 'digits', 'a', 'b', 'expected']
    
    start_time = time.time()
    cases_written = 0
    
    with open(filename, 'w', newline='') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for batch in generator:
            writer.writerows(batch)
            cases_written += len(batch)
            
            # Show progress
            elapsed = time.time() - start_time
            percent = (cases_written / total_cases) * 100
            est_total = (elapsed / cases_written) * total_cases if cases_written > 0 else 0
            remaining = est_total - elapsed
            
            print(f"Progress: {cases_written:,}/{total_cases:,} cases ({percent:.1f}%) - " 
                  f"Elapsed: {elapsed:.1f}s - Remaining: {remaining:.1f}s")
    
    total_time = time.time() - start_time
    print(f"\nComplete! Wrote {cases_written:,} test cases in {total_time:.1f} seconds")
    print(f"Average: {cases_written/total_time:.1f} cases per second")

def main():
    # Number of test cases to generate (1 million)
    num_cases = 1_000_000
    
    print(f"Generating dataset with {num_cases:,} 5-digit subtraction problems")
    print("This may take some time depending on your system...")
    
    # Generate test cases in batches to manage memory usage
    case_generator = generate_subtraction_cases(num_cases, include_negative=True)
    
    # Write to CSV file
    output_dir = os.path.dirname(os.path.abspath(__file__))
    csv_filename = os.path.join(output_dir, "million_5digit_subtraction_dataset.csv")
    
    write_batches_to_csv(case_generator, csv_filename, num_cases)
    
    file_size_mb = os.path.getsize(csv_filename) / (1024 * 1024)
    print(f"File saved to: {csv_filename}")
    print(f"File size: {file_size_mb:.2f} MB")

if __name__ == "__main__":
    main()
