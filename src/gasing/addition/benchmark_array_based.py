#!/usr/bin/env python3
"""
Benchmark script to compare array-based addition with other implementations.
Tests performance across different number sizes to identify the optimal approach
for different scenarios.
"""

import time
import random
import csv
import os
from decimal import Decimal, getcontext
import sys

# Import all addition implementations
from gasingaddition import table_based_addition_optimized as gasing_addition
from traditional import optimized_traditional_addition, traditional_addition
from array_based_addition import array_based_addition, optimized_array_addition, array_chunk_addition

def generate_random_number(num_digits):
    """Generate a random number with exactly the specified digit length."""
    first_digit = random.randint(1, 9)
    rest_digits = [random.randint(0, 9) for _ in range(num_digits - 1)]
    number_str = str(first_digit) + ''.join(str(d) for d in rest_digits)
    return number_str

def benchmark_single_case(a, b):
    """Benchmark all algorithms on a single test case."""
    results = {}
    
    # Gasing addition (original optimized)
    start = time.time()
    gasing_result = gasing_addition(a, b)
    results["gasing"] = {"time": time.time() - start, "result": gasing_result}
    
    # Traditional addition
    start = time.time()
    trad_result = traditional_addition(a, b)
    results["traditional"] = {"time": time.time() - start, "result": trad_result}
    
    # Array-based addition (basic)
    start = time.time()
    array_result = array_based_addition(a, b)
    results["array_basic"] = {"time": time.time() - start, "result": array_result}
    
    # Array-based addition (optimized)
    start = time.time()
    array_opt_result = optimized_array_addition(a, b)
    results["array_optimized"] = {"time": time.time() - start, "result": array_opt_result}
    
    # Array-chunk addition
    start = time.time()
    array_chunk_result = array_chunk_addition(a, b)
    results["array_chunk"] = {"time": time.time() - start, "result": array_chunk_result}
    
    # Python's built-in addition (int)
    start = time.time()
    try:
        if max(len(a), len(b)) >= 4300:
            old_limit = sys.get_int_max_str_digits()
            sys.set_int_max_str_digits(max(len(a), len(b)) + 10)
            
        int_result = str(int(a) + int(b))
        
        if max(len(a), len(b)) >= 4300:
            sys.set_int_max_str_digits(old_limit)
    except (ValueError, OverflowError):
        int_result = gasing_result  # Fallback
    
    results["python_int"] = {"time": time.time() - start, "result": int_result}
    
    # Decimal addition
    start = time.time()
    try:
        getcontext().prec = max(len(a), len(b)) + 10
        dec_result = str(Decimal(a) + Decimal(b))
    except (ValueError, OverflowError):
        dec_result = gasing_result  # Fallback
    
    results["decimal"] = {"time": time.time() - start, "result": dec_result}
    
    # Verify all results match
    expected = gasing_result
    for algo, data in results.items():
        data["correct"] = (data["result"] == expected)
    
    return results

def run_benchmark(num_tests_per_size=100, digit_sizes=[50, 100, 500, 1000, 4000]):
    """Run the benchmark with various number sizes."""
    print(f"Running benchmark with {num_tests_per_size} tests per digit size")
    print(f"Testing digit sizes: {digit_sizes}\n")
    
    # Initialize results structure
    overall_results = {size: {} for size in digit_sizes}
    
    # Test each digit size
    for digit_size in digit_sizes:
        print(f"\n=== Testing {digit_size}-digit numbers ===")
        
        # Initialize counters for this digit size
        algorithms = ["gasing", "traditional", "array_basic", "array_optimized", "array_chunk", "python_int", "decimal"]
        size_results = {algo: {"total_time": 0, "correct": 0} for algo in algorithms}
        
        # Run the tests
        for i in range(num_tests_per_size):
            a = generate_random_number(digit_size)
            b = generate_random_number(digit_size)
            
            # Print progress for the first few
            if i < 3:
                print(f"Test {i+1}: {a[:10]}...+{b[:10]}...")
            elif i == 3:
                print("...")
            
            # Benchmark this case
            case_results = benchmark_single_case(a, b)
            
            # Update results
            for algo, data in case_results.items():
                size_results[algo]["total_time"] += data["time"]
                if data["correct"]:
                    size_results[algo]["correct"] += 1
        
        # Calculate averages and display results for this digit size
        print(f"\nResults for {digit_size}-digit numbers:")
        print("-" * 60)
        print(f"{'Algorithm':<16} | {'Avg Time (ms)':<15} | {'Correct':<10} | {'Relative Speed':<15}")
        print("-" * 60)
        
        # Find fastest algorithm
        fastest_time = min(results["total_time"] for results in size_results.values())
        
        for algo, data in size_results.items():
            avg_time = data["total_time"] / num_tests_per_size
            avg_time_ms = avg_time * 1000  # Convert to ms
            correct = data["correct"]
            relative = data["total_time"] / fastest_time if fastest_time > 0 else float('inf')
            
            print(f"{algo:<16} | {avg_time_ms:<15.3f} | {correct}/{num_tests_per_size:<8} | {relative:<15.2f}x")
            
            # Save to overall results
            overall_results[digit_size][algo] = {
                "avg_time": avg_time,
                "correct": correct,
                "relative_speed": relative
            }
    
    # Create a summary across all digit sizes
    print("\n\n=== OVERALL SUMMARY ===")
    print("Showing absolute time in milliseconds (lower is better)")
    print("-" * 80)
    header = f"{'Digit Size':<10} | " + " | ".join(f"{algo:<14}" for algo in algorithms)
    print(header)
    print("-" * 80)
    
    for size in digit_sizes:
        row = f"{size:<10} | "
        for algo in algorithms:
            avg_time_ms = overall_results[size][algo]["avg_time"] * 1000  # Convert to ms
            row += f"{avg_time_ms:<14.3f} | "
        print(row)
    
    return overall_results

if __name__ == "__main__":
    run_benchmark(num_tests_per_size=20, digit_sizes=[50, 100, 500, 1000, 4000])
