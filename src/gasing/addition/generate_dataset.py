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

def generate_dataset(num_pairs=10000, output_file="large_addition_dataset.csv"):
    """
    Generate a dataset of random number addition problems where both
    numbers in each pair have the same number of digits.
    """
    dataset = []
    
    for i in range(num_pairs):
        # Fixed digit size - a more moderate size for benchmarking
        num_digits = 500
        
        # Generate a pair of random numbers with same digit count
        a = generate_random_number(num_digits)
        b = generate_random_number(num_digits)
        
        # Calculate the expected sum using a custom addition function
        # instead of int conversion which could cause memory issues
        sum_value = table_based_addition_optimized(a, b)
        
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
    print("Generating large addition dataset with equal-length numbers...")
    
    # Generate the dataset
    dataset, output_file = generate_dataset()
    
    # Provide some statistics
    total_pairs = len(dataset)
    avg_length = sum(len(pair['a']) for pair in dataset) / total_pairs
    avg_result_length = sum(len(pair['expected']) for pair in dataset) / total_pairs
    
    # Calculate distribution of digit lengths
    pair_lengths = [len(pair['a']) for pair in dataset]  # Since both numbers have same length
    result_lengths = [len(pair['expected']) for pair in dataset]
    
    min_pair = min(pair_lengths)
    max_pair = max(pair_lengths)
    min_result = min(result_lengths)
    max_result = max(result_lengths)
    
    # Print statistics
    print(f"Dataset generation complete! Saved to {output_file}")
    print(f"Generated {total_pairs} random addition problems")
    print("\nDigit length statistics:")
    print(f"Number pairs: Min = {min_pair}, Max = {max_pair}, Avg = {avg_length:.1f} digits")
    print(f"Results:      Min = {min_result}, Max = {max_result}, Avg = {avg_result_length:.1f} digits")
    
    # Count distribution by digit length
    length_distribution = {}
    for length in pair_lengths:
        length_distribution[length] = length_distribution.get(length, 0) + 1
    
    print("\nDigit length distribution:")
    for length in sorted(length_distribution.keys()):
        count = length_distribution[length]
        percentage = (count / total_pairs) * 100
        print(f"{length} digits: {count} pairs ({percentage:.1f}%)")
    
    # Generate a few examples
    print("\nExample addition problems:")
    for i in range(min(3, len(dataset))):
        print(f"Example {i+1}: {len(dataset[i]['a'])} digits")
        # Show just the first and last few digits if the numbers are very long
        if len(dataset[i]['a']) > 20:
            a_display = dataset[i]['a'][:10] + "..." + dataset[i]['a'][-10:]
            b_display = dataset[i]['b'][:10] + "..." + dataset[i]['b'][-10:]
            sum_display = dataset[i]['expected'][:10] + "..." + dataset[i]['expected'][-10:]
            print(f"  {a_display}")
            print(f"+ {b_display}")
            print(f"= {sum_display}")
        else:
            print(f"  {dataset[i]['a']}")
            print(f"+ {dataset[i]['b']}")
            print(f"= {dataset[i]['expected']}")
    
    # Provide instructions for using the dataset
    print("\nTo use this dataset with the comparison tool:")
    print("  python library_comparison.py [number_of_test_cases]")

if __name__ == "__main__":
    main()
