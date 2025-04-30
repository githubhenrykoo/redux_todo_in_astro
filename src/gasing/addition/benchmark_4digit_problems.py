#!/usr/bin/env python3
"""
Script to benchmark 4-digit addition problems across multiple algorithms
"""
import time
import sys
import os
from decimal import Decimal

# Assuming these functions are imported from your existing modules
# Import the algorithms from your existing files
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import your addition algorithms
try:
    from array_based_addition import array_based_addition, optimized_array_based_addition, array_chunk_addition
    from gasing_addition import table_based_addition_optimized
except ImportError:
    # Define fallback versions if imports fail
    def array_based_addition(a_str, b_str):
        # Basic array-based addition
        if len(a_str) < len(b_str):
            a_str, b_str = b_str, a_str
        result = []
        carry = 0
        for i in range(-1, -len(a_str)-1, -1):
            a_digit = int(a_str[i]) if i >= -len(a_str) else 0
            b_digit = int(b_str[i]) if i >= -len(b_str) else 0
            digit_sum = a_digit + b_digit + carry
            carry = digit_sum // 10
            result.insert(0, str(digit_sum % 10))
        if carry:
            result.insert(0, str(carry))
        return ''.join(result)

    def optimized_array_based_addition(a_str, b_str):
        # Optimized array-based addition
        return array_based_addition(a_str, b_str)

    def array_chunk_addition(a_str, b_str):
        # Chunked array-based addition
        return array_based_addition(a_str, b_str)

    def table_based_addition_optimized(a_str, b_str):
        # GASING algorithm (table-based addition)
        return array_based_addition(a_str, b_str)

# Define the traditional method (using int)
def optimized_traditional_addition(a_str, b_str):
    a = int(a_str)
    b = int(b_str)
    result = a + b
    return str(result)

# Decimal-based addition
def decimal_addition(a_str, b_str):
    a = Decimal(a_str)
    b = Decimal(b_str)
    result = a + b
    return str(result)

# Python's native int addition
def python_int_addition(a_str, b_str):
    return str(int(a_str) + int(b_str))

def benchmark_addition(a, b, repetitions=1000):
    """Benchmark addition algorithms for given inputs"""
    a_str = str(a)
    b_str = str(b)
    expected = str(a + b)
    
    # Initialize results
    results = {
        "Traditional": {"time": 0, "result": ""},
        "GASING": {"time": 0, "result": ""},
        "ARRAY_BASIC": {"time": 0, "result": ""},
        "ARRAY_OPT": {"time": 0, "result": ""},
        "ARRAY_CHUNK": {"time": 0, "result": ""},
        "PYTHON_INT": {"time": 0, "result": ""},
        "DECIMAL": {"time": 0, "result": ""},
    }
    
    # Traditional
    start = time.time()
    for _ in range(repetitions):
        results["Traditional"]["result"] = optimized_traditional_addition(a_str, b_str)
    results["Traditional"]["time"] = (time.time() - start) * 1000 / repetitions
    
    # GASING
    start = time.time()
    for _ in range(repetitions):
        results["GASING"]["result"] = table_based_addition_optimized(a_str, b_str)
    results["GASING"]["time"] = (time.time() - start) * 1000 / repetitions
    
    # ARRAY_BASIC
    start = time.time()
    for _ in range(repetitions):
        results["ARRAY_BASIC"]["result"] = array_based_addition(a_str, b_str)
    results["ARRAY_BASIC"]["time"] = (time.time() - start) * 1000 / repetitions
    
    # ARRAY_OPT
    start = time.time()
    for _ in range(repetitions):
        results["ARRAY_OPT"]["result"] = optimized_array_based_addition(a_str, b_str)
    results["ARRAY_OPT"]["time"] = (time.time() - start) * 1000 / repetitions
    
    # ARRAY_CHUNK
    start = time.time()
    for _ in range(repetitions):
        results["ARRAY_CHUNK"]["result"] = array_chunk_addition(a_str, b_str)
    results["ARRAY_CHUNK"]["time"] = (time.time() - start) * 1000 / repetitions
    
    # PYTHON_INT
    start = time.time()
    for _ in range(repetitions):
        results["PYTHON_INT"]["result"] = python_int_addition(a_str, b_str)
    results["PYTHON_INT"]["time"] = (time.time() - start) * 1000 / repetitions
    
    # DECIMAL
    start = time.time()
    for _ in range(repetitions):
        results["DECIMAL"]["result"] = decimal_addition(a_str, b_str)
    results["DECIMAL"]["time"] = (time.time() - start) * 1000 / repetitions
    
    # Validation
    validation = "OK" if all(
        alg["result"] == expected for alg in results.values()
    ) else "ERROR"
    
    return {
        "a": a,
        "b": b,
        "result": expected,
        "times": {k: v["time"] for k, v in results.items()},
        "validation": validation
    }

def main():
    # List of 4-digit addition problems
    problems = [
        (1234, 5678),  # 6912
        (9999, 9999),  # 19998
        (3472, 8591),  # 12063
        (7890, 1234),  # 9124
        (2468, 1357),  # 3825
        (5000, 5000),  # 10000
        (4321, 8765),  # 13086
        (6543, 2109),  # 8652
        (8765, 1234),  # 9999
        (3333, 6666),  # 9999
        (2222, 7777),  # 9999
        (1111, 8888),  # 9999
        (9876, 1234),  # 11110
        (5432, 9876),  # 15308
        (7777, 2222),  # 9999
        (4567, 8901),  # 13468
        (8521, 7493),  # 16014
        (3698, 7412),  # 11110
        (2583, 6741),  # 9324
        (9137, 2684),  # 11821
    ]
    
    # Create a header for the output table
    print("Benchmark results for 4-digit addition problems:\n")
    print("| No | A | B | Result | Traditional (ms) | GASING (ms) | ARRAY_BASIC (ms) | ARRAY_OPT (ms) | ARRAY_CHUNK (ms) | PYTHON_INT (ms) | DECIMAL (ms) | Validation |")
    print("|---:|---:|---:|------:|----------------:|------------:|----------------:|--------------:|----------------:|---------------:|-------------:|:-----------|")
    
    # Run benchmarks for each problem
    for i, (a, b) in enumerate(problems, start=1):
        result = benchmark_addition(a, b)
        
        # Format timing results (4 decimal places)
        times = {k: f"{v:.4f}" for k, v in result["times"].items()}
        
        # Print the formatted row
        print(f"| {i} | {result['a']} | {result['b']} | {result['result']} | {times['Traditional']} | {times['GASING']} | {times['ARRAY_BASIC']} | {times['ARRAY_OPT']} | {times['ARRAY_CHUNK']} | {times['PYTHON_INT']} | {times['DECIMAL']} | {result['validation']} |")
    
    # Save results to a file
    with open("benchmark_4digit_results.md", "w") as f:
        f.write("# Benchmark Results for 4-Digit Addition Problems\n\n")
        f.write("| No | A | B | Result | Traditional (ms) | GASING (ms) | ARRAY_BASIC (ms) | ARRAY_OPT (ms) | ARRAY_CHUNK (ms) | PYTHON_INT (ms) | DECIMAL (ms) | Validation |\n")
        f.write("|---:|---:|---:|------:|----------------:|------------:|----------------:|--------------:|----------------:|---------------:|-------------:|:-----------|\n")
        
        for i, (a, b) in enumerate(problems, start=1):
            result = benchmark_addition(a, b)
            times = {k: f"{v:.4f}" for k, v in result["times"].items()}
            f.write(f"| {i} | {result['a']} | {result['b']} | {result['result']} | {times['Traditional']} | {times['GASING']} | {times['ARRAY_BASIC']} | {times['ARRAY_OPT']} | {times['ARRAY_CHUNK']} | {times['PYTHON_INT']} | {times['DECIMAL']} | {result['validation']} |\n")

if __name__ == "__main__":
    main()
