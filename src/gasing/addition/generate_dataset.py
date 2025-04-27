#!/usr/bin/env python3
"""
Generate a large dataset of random number addition problems.
Creates a CSV file with 1000 random pairs of numbers between 10-50 digits.
"""

import random
import csv
import os

def generate_random_number(min_digits=10, max_digits=50):
    """Generate a random number with specified digit length."""
    # Determine number of digits for this number
    num_digits = random.randint(min_digits, max_digits)
    
    # First digit can't be zero (except for single-digit numbers)
    first_digit = random.randint(1, 9)
    
    # Generate the rest of the digits
    rest_digits = [random.randint(0, 9) for _ in range(num_digits - 1)]
    
    # Combine into a string
    number_str = str(first_digit) + ''.join(str(d) for d in rest_digits)
    
    return number_str

def generate_dataset(num_pairs=1000, output_file="large_addition_dataset.csv"):
    """Generate a dataset of random number addition problems."""
    dataset = []
    
    for i in range(num_pairs):
        # Generate a pair of random numbers
        a = generate_random_number()
        b = generate_random_number()
        
        # Calculate the expected sum
        sum_value = str(int(a) + int(b))
        
        # Create a name for this test case
        name = f"Random_{i+1}_{len(a)}d+{len(b)}d"
        
        # Add to dataset
        dataset.append({
            "name": name,
            "a": a,
            "b": b,
            "expected": sum_value
        })
    
    # Write to CSV file
    with open(output_file, 'w', newline='') as csvfile:
        fieldnames = ['name', 'a', 'b', 'expected']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        writer.writeheader()
        for pair in dataset:
            writer.writerow(pair)
    
    return dataset, output_file

def main():
    """Generate the dataset and provide statistics."""
    print("Generating large addition dataset...")
    
    # Generate the dataset
    dataset, output_file = generate_dataset()
    
    # Provide some statistics
    total_pairs = len(dataset)
    avg_a_length = sum(len(pair['a']) for pair in dataset) / total_pairs
    avg_b_length = sum(len(pair['b']) for pair in dataset) / total_pairs
    avg_result_length = sum(len(pair['expected']) for pair in dataset) / total_pairs
    
    # Calculate distribution of digit lengths
    a_lengths = [len(pair['a']) for pair in dataset]
    b_lengths = [len(pair['b']) for pair in dataset]
    result_lengths = [len(pair['expected']) for pair in dataset]
    
    min_a = min(a_lengths)
    max_a = max(a_lengths)
    min_b = min(b_lengths)
    max_b = max(b_lengths)
    min_result = min(result_lengths)
    max_result = max(result_lengths)
    
    # Print statistics
    print(f"Dataset generation complete! Saved to {output_file}")
    print(f"Generated {total_pairs} random addition problems")
    print("\nDigit length statistics:")
    print(f"First number:  Min = {min_a}, Max = {max_a}, Avg = {avg_a_length:.1f}")
    print(f"Second number: Min = {min_b}, Max = {max_b}, Avg = {avg_b_length:.1f}")
    print(f"Result:        Min = {min_result}, Max = {max_result}, Avg = {avg_result_length:.1f}")
    
    # Generate a few examples
    print("\nExample addition problems:")
    for i in range(min(3, len(dataset))):
        print(f"Example {i+1}: {dataset[i]['a']} + {dataset[i]['b']} = {dataset[i]['expected']}")
    
    # Provide instructions for using the dataset
    print("\nTo use this dataset with the comparison tool:")
    print("1. Run 'python large_number_test.py'")
    print("2. Choose option 6 to import test cases from CSV")
    print("3. Then choose option 1 or 2 to run tests on the imported dataset")

if __name__ == "__main__":
    main()
