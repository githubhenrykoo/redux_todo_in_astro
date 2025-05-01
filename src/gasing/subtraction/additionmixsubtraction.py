import cProfile
import pstats
import time
import sys
import csv
import random
from typing import List, Tuple, Optional


#!/usr/bin/env python3
"""
Gasing Subtraction: Optimized large number subtraction algorithm using lookup tables and streamlined borrow propagation.
Specialized for decimal (base 10) numbers.
This verbose version focuses on educational clarity with detailed step-by-step logging.
"""

# Pre-compute lookup table for digit subtraction (without negative result)
DIGIT_SUBTRACTIONS = [
    [0, -1, -2, -3, -4, -5, -6, -7, -8, -9],    # 0-0, 0-1, ..., 0-9
    [1, 0, -1, -2, -3, -4, -5, -6, -7, -8],     # 1-0, 1-1, ..., 1-9
    [2, 1, 0, -1, -2, -3, -4, -5, -6, -7],      # 2-0, ...
    [3, 2, 1, 0, -1, -2, -3, -4, -5, -6],
    [4, 3, 2, 1, 0, -1, -2, -3, -4, -5],
    [5, 4, 3, 2, 1, 0, -1, -2, -3, -4],
    [6, 5, 4, 3, 2, 1, 0, -1, -2, -3],
    [7, 6, 5, 4, 3, 2, 1, 0, -1, -2],
    [8, 7, 6, 5, 4, 3, 2, 1, 0, -1],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
]

# Pre-compute the strings for single digits
DIGIT_STRINGS = [str(i) for i in range(10)]

def table_based_subtraction_verbose(a_str: str, b_str: str, verbose: bool = True) -> str:
    """
    Implements table-based subtraction algorithm with detailed verbose output.
    
    This approach:
    1. Uses a lookup table to determine the difference at each position
    2. Identifies borrow chains where borrowing propagates through multiple positions
    3. Works directly on string digits right-to-left
    
    Args:
        a_str: Minuend as a string (must be >= b_str)
        b_str: Subtrahend as a string
        verbose: Whether to print step-by-step details
    
    Returns:
        The difference as a string
    """
    # For small numbers, use built-in method (faster and simpler to display)
    if len(a_str) < 20 and len(b_str) < 20 and not verbose:
        return str(int(a_str) - int(b_str))
    
    # Cache length calculations to avoid repeated calls
    len_a, len_b = len(a_str), len(b_str)
    max_len = max(len_a, len_b)
    
    # Optimize padding by only padding when necessary
    if len_a < max_len:
        padded_a = '0' * (max_len - len_a) + a_str
    else:
        padded_a = a_str
        
    if len_b < max_len:
        padded_b = '0' * (max_len - len_b) + b_str
    else:
        padded_b = b_str
    
    # Print verbose info after all calculations for efficiency
    if verbose:
        print("\nTABLE-BASED SUBTRACTION ALGORITHM")
        print("================================")
        print(f"A (minuend):      {a_str}")
        print(f"B (subtrahend):   {b_str}")
        print(f"\nPadded A: {padded_a}")
        print(f"Padded B: {padded_b}")
    
    # Pre-allocate arrays with known size for better memory efficiency
    result = [0] * max_len
    # Only allocate borrows array if in verbose mode
    borrows = [0] * max_len if verbose else None
    
    # First pass processing - only do this in verbose mode since it's for educational purposes
    if verbose:
        initial_diffs = []
        borrow_positions = []
        
        print("\nINITIAL DIGIT DIFFERENCES (before processing borrows):")
        print("Position | A digit | B digit | Raw difference")
        print("-" * 45)
        
        # Pre-allocate the list to avoid resizing
        initial_diffs = [0] * max_len
        
        for i in range(max_len-1, -1, -1):
            a_digit = int(padded_a[i])
            b_digit = int(padded_b[i])
            
            # Get the difference without considering borrows yet
            digit_diff = DIGIT_SUBTRACTIONS[a_digit][b_digit]
            initial_diffs[max_len-1-i] = digit_diff
            
            pos = max_len - i
            print(f"{pos:^8} | {a_digit:^7} | {b_digit:^7} | {digit_diff:^14}")
            
            # Note positions requiring borrows
            if digit_diff < 0:
                borrow_positions.append(i)
        
        # Identify borrow chains - only in verbose mode
        borrow_chains = []
        if borrow_positions:
            current_chain = [borrow_positions[0]]
            
            for i in range(1, len(borrow_positions)):
                # If consecutive positions or only 1 position apart
                if borrow_positions[i] == borrow_positions[i-1] - 1:
                    current_chain.append(borrow_positions[i])
                else:
                    # End of chain, start a new one
                    borrow_chains.append(list(current_chain))
                    current_chain = [borrow_positions[i]]
            
            # Add the last chain
            if current_chain:  # Only add if non-empty
                borrow_chains.append(list(current_chain))
        
        if borrow_chains:
            print("\nBORROW CHAINS:")
            for i, chain in enumerate(borrow_chains):
                chain_positions = [max_len - pos for pos in chain]  # Convert to 1-indexed positions
                print(f"Chain {i+1}: positions {sorted(chain_positions)}")
            
        print("\nPROCESSING SUBTRACTION WITH BORROWS:")
        print("Position | A digit | B digit | Borrow in | Difference | Borrow out")
        print("-" * 70)
    
    # Main calculation - this is the core algorithm
    borrow = 0
    
    # Use direct indexing for improved performance in the loop
    # Process from right to left (least significant digit first)
    for i in range(max_len-1, -1, -1):
        a_digit = int(padded_a[i])
        b_digit = int(padded_b[i])
        
        # Apply previous borrow
        a_digit_adjusted = a_digit - borrow
        
        # Calculate difference with optimized lookup
        if a_digit_adjusted >= 0:
            diff = DIGIT_SUBTRACTIONS[a_digit_adjusted][b_digit]
        else:
            # Special case when a_digit is 0 and there's a borrow
            diff = DIGIT_SUBTRACTIONS[a_digit_adjusted + 10][b_digit] - 1
        
        # Determine if we need a new borrow for next position
        if diff < 0:
            diff += 10
            next_borrow = 1
        else:
            next_borrow = 0
        
        # Store result
        result[i] = diff
        
        # Track borrow for visualization, but only in verbose mode
        if verbose and borrows is not None and next_borrow and i > 0:
            borrows[i-1] = 1  # Applied to next position to the left
        
        if verbose:
            pos = max_len - i
            print(f"{pos:^8} | {a_digit:^7} | {b_digit:^7} | {borrow:^9} | {diff:^10} | {next_borrow:^10}")
        
        # Update borrow for next iteration
        borrow = next_borrow
    
    # Optimize leading zero removal 
    start = 0
    while start < max_len - 1 and result[start] == 0:
        start += 1
    
    # Optimize string conversion with pre-computed digit strings
    result_str = ''.join(DIGIT_STRINGS[d] for d in result[start:])
    
    # Only do the visualization in verbose mode
    if verbose:
        print("\nSTEP-BY-STEP CALCULATION:")
        
        # Borrowing visualization
        a_display = padded_a[start:]
        b_display = padded_b[start:]
        
        # Only process these strings if in verbose mode
        borrow_str = ""
        a_borrowed = ""
        
        if borrows:
            # Pre-allocate strings for better efficiency
            borrow_str_chars = [' '] * (max_len - start)
            a_borrowed_chars = ['0'] * (max_len - start)
            
            for i, b in enumerate(borrows[start:]):
                if b > 0:
                    borrow_str_chars[i] = '1'
            
            # Show borrowed-from digits
            for i, digit in enumerate(a_display):
                if i < len(borrows[start:]) and borrows[start+i]:
                    # This digit had a borrow from it
                    a_borrowed_chars[i] = DIGIT_STRINGS[int(digit) - 1]
                else:
                    a_borrowed_chars[i] = digit
            
            borrow_str = ''.join(borrow_str_chars)
            a_borrowed = ''.join(a_borrowed_chars)
            
            print(f"  {borrow_str}")  # Borrows
        
        print(f"  {a_display}")   # Original A
        
        if a_borrowed:
            print(f"  {a_borrowed}")  # A after borrows
            
        print(f"- {b_display}")   # B
        print(f"  {'-' * len(result_str)}")
        print(f"  {result_str}")  # Result
        
        # Verify the result using built-in subtraction
        try:
            expected_result = str(int(a_str) - int(b_str))
            print(f"\nVERIFICATION:")
            print(f"Expected result: {expected_result}")
            print(f"Calculated result: {result_str}")
            
            if expected_result == result_str:
                print(" CORRECT - Results match!")
            else:
                print(" ERROR - Results don't match!")
        except ValueError:
            print("Could not verify - inputs must be valid integers")
    
    return result_str

def gasing_subtraction_verbose(a_str: str, b_str: str, verbose: bool = True) -> str:
    """
    High-performance optimized implementation of Gasing subtraction with verbose output.

    Args:
        a_str: Minuend as a string
        b_str: Subtrahend as a string
        verbose: Whether to print step-by-step details

    Returns:
        The difference as a string (with minus sign if negative)
    """
    # Fast check for small numbers - avoid swapping if possible
    if len(a_str) < 20 and len(b_str) < 20 and not verbose:
        return str(int(a_str) - int(b_str))
    
    # Determine if result should be negative
    negative = False
    
    # Use cached lengths for comparison
    len_a, len_b = len(a_str), len(b_str)
    
    if len_a < len_b or (len_a == len_b and a_str < b_str):
        if verbose:
            print("\nDETECTED NEGATIVE RESULT - Swapping operands")
            print(f"Original: {a_str} - {b_str}")
            print(f"Swapped: {b_str} - {a_str}, will add negative sign to result")
        a_str, b_str = b_str, a_str
        negative = True
    
    # Calculate the result
    result = table_based_subtraction_verbose(a_str, b_str, verbose)
    
    # Apply sign if needed
    if negative:
        result = '-' + result
        if verbose:
            print(f"\nFINAL RESULT (with sign): {result}")
    
    return result

def benchmark_subtraction(iterations: int = 100, verbose: bool = False) -> None:
    """Run benchmarks on the Gasing subtraction algorithm with various input sizes."""
    # Dataset path
    dataset_path = "src/gasing/subtraction/extended_subtraction_dataset.csv"
    
    print("\nBENCHMARKING GASING SUBTRACTION ALGORITHM")
    print("=" * 50)
    print(f"Running benchmarks using dataset: {dataset_path}")
    print(f"Running {iterations} iterations per test case")
    
    # Load test cases from the dataset
    try:
        test_cases = []
        # Digit ranges we want to benchmark
        target_ranges = [1, 10, 100, 1000, 10000]
        selected_cases = {size: None for size in target_ranges}
        
        with open(dataset_path, 'r') as f:
            reader = csv.reader(f)
            # Skip header if present
            header = next(reader, None)
            if header and header[0].lower() == "name":
                pass  # Header skipped
            else:
                # Go back to start if no header
                f.seek(0)
            
            for row in reader:
                if len(row) >= 5:  # Ensure row has enough fields
                    digits = int(row[1]) if row[1].isdigit() else 0
                    a_str = row[2]
                    b_str = row[3]
                    
                    # Check if this case matches one of our target sizes
                    for size in target_ranges:
                        if size - 5 <= digits <= size + 5 and selected_cases[size] is None:
                            selected_cases[size] = (a_str, b_str, row[0])  # Store test case with its name
        
        # Add the selected cases to our test set, ensuring we have a diverse sample
        for size, case in selected_cases.items():
            if case:
                test_cases.append(case)
        
        # Fill with fallback test cases if needed
        if not test_cases:
            print("Warning: No suitable test cases found in dataset, using fallback cases")
            test_cases = [
                ("42", "17", "Small (2 digits)"),
                ("12345", "6789", "Medium (5 digits)"),
                ("9" * 100, "1" * 100, "Large (100 digits)"),
                ("9" * 1000, "1" * 1000, "Very large (1000 digits)")
            ]
    except Exception as e:
        print(f"Error reading dataset: {e}")
        print("Using fallback test cases...")
        test_cases = [
            ("42", "17", "Small (2 digits)"),
            ("12345", "6789", "Medium (5 digits)"),
            ("9" * 100, "1" * 100, "Large (100 digits)"),
            ("9" * 1000, "1" * 1000, "Very large (1000 digits)")
        ]
    
    # Run benchmarks on the selected test cases
    for a_str, b_str, case_name in test_cases:
        print(f"\nTest case: {case_name} ({len(a_str)} digits)")
        
        # Time the operation
        start_time = time.time()
        
        for _ in range(iterations):
            gasing_subtraction_verbose(a_str, b_str, verbose=False)
            
        elapsed = time.time() - start_time
        avg_time = elapsed / iterations
        
        print(f"Total time: {elapsed:.6f} seconds")
        print(f"Average time per iteration: {avg_time:.9f} seconds")
        
        # Run once with verbose output if requested
        if verbose:
            print("\nSample verbose output:")
            gasing_subtraction_verbose(a_str, b_str, verbose=True)
    
    print("\nBenchmark complete!")

def load_subtraction_problem(dataset_path):
    """Load a random subtraction problem from the dataset."""
    try:
        with open(dataset_path, 'r') as f:
            reader = csv.reader(f)
            subtraction_problems = list(reader)
        
        # Select a random problem (skip header if present)
        start_idx = 1 if subtraction_problems and subtraction_problems[0][0].lower() == "name" else 0
        random_problem = random.choice(subtraction_problems[start_idx:])
        
        # Format depends on the CSV structure: name, digits, a, b, expected
        problem_name = random_problem[0]
        a_str = random_problem[2]  # 'a' value is in column 3
        b_str = random_problem[3]  # 'b' value is in column 4
        expected = random_problem[4] if len(random_problem) > 4 else ""
        
        print(f"Selected problem: {problem_name}")
        print(f"A: {a_str}")
        print(f"B: {b_str}")
        if expected:
            print(f"Expected result: {expected}")
        
        return a_str, b_str, expected
    except Exception as e:
        print(f"Error reading dataset: {e}")
        print("Using fallback values...")
        return "98412", "73304", ""

def main() -> None:
    """Run interactive Table-Based Gasing subtraction with verbose logging."""
    print("Table-Based Gasing Subtraction")
    print("Verbose Educational Version")
    print("-"*50)
    
    # Check for benchmark mode
    if len(sys.argv) > 1 and sys.argv[1] == "--benchmark":
        iterations = 100
        verbose = False
        
        if len(sys.argv) > 2:
            try:
                iterations = int(sys.argv[2])
            except ValueError:
                pass
                
        if len(sys.argv) > 3 and sys.argv[3] == "--verbose":
            verbose = True
            
        benchmark_subtraction(iterations, verbose)
        return
    
    # Interactive mode
    try:
        # Load a random subtraction problem from the dataset
        dataset_path = "src/gasing/subtraction/extended_subtraction_dataset.csv"
        a_str, b_str, _ = load_subtraction_problem(dataset_path)
        
        if not a_str.strip() or not b_str.strip():
            print("Error: Both numbers must be provided and non-empty.")
            return
        
        # Calculate difference using our algorithm with verbose output
        result = gasing_subtraction_verbose(a_str, b_str, verbose=True)
        
        # Final result display
        print(f"\nFINAL RESULT: {a_str} - {b_str} = {result}")
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # Use cProfile to measure performance
    with cProfile.Profile() as profile:
        main()
    
    # Print profile stats
    stats = pstats.Stats(profile)
    stats.sort_stats('cumtime')
    print("\nPERFORMANCE PROFILE:")
    stats.print_stats(10)  # Show top 10 functions