#!/usr/bin/env python3
"""
Generate a large dataset of random number addition problems.
Creates a CSV file with 10000 pairs of numbers, where both numbers
in each pair have exactly 500 digits (large but well below Python's int conversion limit).
"""

import random
import csv
import os
from gasingaddition import table_based_addition_optimized

def generate_random_number(num_digits):
    """
    Generate a random number with exactly the specified digit length.
    
    Args:
        num_digits: The exact number of digits the random number should have
    
    Returns:
        A string representation of the random number
    """
    # First digit can't be zero
    first_digit = random.randint(1, 9)
    
    # Generate the rest of the digits
    rest_digits = [random.randint(0, 9) for _ in range(num_digits - 1)]
    
    # Combine into a string
    number_str = str(first_digit) + ''.join(str(d) for d in rest_digits)
    
    return number_str

def generate_dataset(output_file="large_addition_dataset.csv"):
    """
    Generate a dataset of random number addition problems with varying digit lengths.
    Each digit length will have 100 pairs of numbers.
    """
    # Define the digit lengths we want to test
    digit_lengths = [1, 5, 10, 50, 100, 500, 1000, 5000, 10000]
    pairs_per_length = 100
    dataset = []
    
    for num_digits in digit_lengths:
        for i in range(pairs_per_length):
            # Generate a pair of random numbers with same digit count
            a = generate_random_number(num_digits)
            b = generate_random_number(num_digits)
            
            # Calculate the expected sum
            sum_value = table_based_addition_optimized(a, b)
            
            # Create a name for this test case
            name = f"Random_{num_digits}d_{i+1}"
            
            # Add to dataset
            dataset.append({
                "name": name,
                "digits": num_digits,
                "a": a,
                "b": b,
                "expected": sum_value
            })
    
    # Write to CSV file
    with open(output_file, 'w', newline='') as csvfile:
        fieldnames = ['name', 'digits', 'a', 'b', 'expected']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        writer.writeheader()
        for pair in dataset:
            writer.writerow(pair)
    
    return dataset, output_file

def main():
    """Generate the dataset and provide statistics."""
    print("Generating addition dataset with varying digit lengths...")
    
    # Generate the dataset
    dataset, output_file = generate_dataset()
    
    # Group data by digit length
    by_digits = {}
    for pair in dataset:
        digits = pair['digits']
        if digits not in by_digits:
            by_digits[digits] = []
        by_digits[digits].append(pair)
    
    # Print statistics
    print(f"\nDataset generation complete! Saved to {output_file}")
    print(f"Generated {len(dataset)} total addition problems")
    
    print("\nDistribution by digit length:")
    for digits in sorted(by_digits.keys()):
        count = len(by_digits[digits])
        print(f"{digits} digits: {count} pairs")
    
    # Generate a few examples for each digit length
    print("\nExample addition problems:")
    for digits in sorted(by_digits.keys()):
        print(f"\nDigit length: {digits}")
        example = by_digits[digits][0]  # Show first example of each length
        
        if digits > 20:
            a_display = example['a'][:10] + "..." + example['a'][-10:]
            b_display = example['b'][:10] + "..." + example['b'][-10:]
            sum_display = example['expected'][:10] + "..." + example['expected'][-10:]
        else:
            a_display = example['a']
            b_display = example['b']
            sum_display = example['expected']
            
        print(f"  {a_display}")
        print(f"+ {b_display}")
        print(f"= {sum_display}")
    
    print("\nTo use this dataset with the comparison tool:")
    print("  python library_comparison.py [number_of_test_cases]")

if __name__ == "__main__":
    main()
