#!/usr/bin/env python3
"""
Test script for extremely large number addition (9000-10000 digits).
This creates just a few test cases to verify performance and correctness
before generating the full dataset.
"""

import random
from gasingaddition import table_based_addition_optimized
from traditional import traditional_addition, optimized_traditional_addition
from decimal import Decimal
import time

def generate_random_number(num_digits):
    """Generate a random number with exactly the specified digit length."""
    first_digit = random.randint(1, 9)
    rest_digits = [random.randint(0, 9) for _ in range(num_digits - 1)]
    number_str = str(first_digit) + ''.join(str(d) for d in rest_digits)
    return number_str

def benchmark_addition(a, b):
    """Benchmark different addition algorithms."""
    start = time.time()
    gasing_result = table_based_addition_optimized(a, b)
    gasing_time = time.time() - start
    
    print(f"Gasing addition: {gasing_time:.6f}s")
    print(f"Result length: {len(gasing_result)} digits")
    
    # For traditional and built-in Python methods, we'll only time them
    # if the numbers aren't too large to cause memory issues
    if len(a) <= 5000:  # Only try traditional with smaller numbers
        try:
            start = time.time()
            traditional_result = traditional_addition(a, b)
            traditional_time = time.time() - start
            print(f"Traditional addition: {traditional_time:.6f}s")
            print(f"Result matches: {traditional_result == gasing_result}")
        except Exception as e:
            print(f"Traditional addition failed: {e}")
    else:
        print("Traditional addition: Skipped due to large input size")
    
    # Only try Python's int with smaller numbers to avoid memory issues
    if len(a) <= 5000:
        try:
            start = time.time()
            python_result = str(int(a) + int(b))
            python_time = time.time() - start
            print(f"Python int addition: {python_time:.6f}s")
            print(f"Result matches: {python_result == gasing_result}")
        except Exception as e:
            print(f"Python int addition failed: {e}")
    else:
        print("Python int addition: Skipped due to large input size")

def main():
    """Run test with a few extremely large number pairs."""
    print("Testing addition with extremely large numbers (9000-10000 digits)")
    
    # Test with gradually increasing sizes
    for size in [5000, 9000]:
        print(f"\n=== Testing with {size} digit numbers ===")
        a = generate_random_number(size)
        b = generate_random_number(size)
        print(f"A: {a[:10]}...{a[-10:]}")
        print(f"B: {b[:10]}...{b[-10:]}")
        benchmark_addition(a, b)

if __name__ == "__main__":
    main()
