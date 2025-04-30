#!/usr/bin/env python3
"""
Individual Addition Problem Benchmark Script

This script generates random addition problems with varying digit sizes (1-50)
and benchmarks the performance of different addition algorithms for each problem.
Results are displayed in a table format similar to the provided example.
"""

import random
import time
import decimal
import sys
from gasingaddition import gasing_addition
from traditional import optimized_traditional_addition

# Import or define other algorithm implementations
def array_basic_addition(a_str, b_str):
    # Convert strings to arrays of digits
    a_digits = [int(d) for d in a_str]
    b_digits = [int(d) for d in b_str]
    
    # Ensure a is the longer number
    if len(a_digits) < len(b_digits):
        a_digits, b_digits = b_digits, a_digits
    
    # Pad shorter number with zeros
    b_digits = [0] * (len(a_digits) - len(b_digits)) + b_digits
    
    # Process addition right-to-left
    result = []
    carry = 0
    
    for i in range(len(a_digits)-1, -1, -1):
        digit_sum = a_digits[i] + b_digits[i] + carry
        result.insert(0, digit_sum % 10)
        carry = digit_sum // 10
    
    # Handle final carry
    if carry:
        result.insert(0, carry)
    
    return ''.join(str(d) for d in result)

def array_optimized_addition(a_str, b_str):
    # Fast path for small numbers
    if len(a_str) < 15 and len(b_str) < 15:
        return str(int(a_str) + int(b_str))
    
    # Convert strings to arrays of integers directly
    a_digits = [ord(d) - 48 for d in a_str]
    b_digits = [ord(d) - 48 for d in b_str]
    
    # Ensure a is the longer number
    if len(a_digits) < len(b_digits):
        a_digits, b_digits = b_digits, a_digits
    
    # Pre-allocate result array
    result = [0] * (len(a_digits) + 1)
    
    # Pad shorter number and process addition
    padding = len(a_digits) - len(b_digits)
    carry = 0
    
    for i in range(len(a_digits)-1, -1, -1):
        # Only add b digit if it exists
        b_digit = b_digits[i-padding] if i >= padding else 0
        digit_sum = a_digits[i] + b_digit + carry
        
        result[i+1] = digit_sum % 10
        carry = digit_sum // 10
    
    # Set final carry
    result[0] = carry
    
    # Remove leading zero if no carry
    if result[0] == 0:
        result = result[1:]
    
    # Convert to string efficiently
    return ''.join(str(d) for d in result)

def array_chunk_addition(a_str, b_str, chunk_size=4):
    # Fast path for small numbers
    if len(a_str) < 15 and len(b_str) < 15:
        return str(int(a_str) + int(b_str))
    
    # Pad strings to be divisible by chunk_size
    len_a, len_b = len(a_str), len(b_str)
    max_len = max(len_a, len_b)
    pad_len = (chunk_size - (max_len % chunk_size)) % chunk_size
    
    a_padded = '0' * (pad_len + max_len - len_a) + a_str
    b_padded = '0' * (pad_len + max_len - len_b) + b_str
    padded_len = len(a_padded)
    
    # Process chunks right-to-left
    result = []
    carry = 0
    
    for i in range(padded_len-chunk_size, -1, -chunk_size):
        # Convert chunks to integers
        a_chunk = int(a_padded[i:i+chunk_size])
        b_chunk = int(b_padded[i:i+chunk_size])
        
        # Add chunks with carry
        chunk_sum = a_chunk + b_chunk + carry
        
        # Handle carrying between chunks
        if i > 0:
            # Not the leftmost chunk
            carry = chunk_sum // (10 ** chunk_size)
            chunk_sum %= (10 ** chunk_size)
            # Pad chunk for consistent length
            result.insert(0, str(chunk_sum).zfill(chunk_size))
        else:
            # Leftmost chunk, no need to handle carry separately
            result.insert(0, str(chunk_sum))
    
    return ''.join(result)

def python_int_addition(a_str, b_str):
    try:
        # Direct Python int addition
        return str(int(a_str) + int(b_str))
    except:
        # Fallback for very large numbers
        with decimal.localcontext() as ctx:
            ctx.prec = max(len(a_str), len(b_str)) + 10
            a_dec = decimal.Decimal(a_str)
            b_dec = decimal.Decimal(b_str)
            result = a_dec + b_dec
            return str(result)

def decimal_addition(a_str, b_str):
    with decimal.localcontext() as ctx:
        ctx.prec = max(len(a_str), len(b_str)) + 10
        a_dec = decimal.Decimal(a_str)
        b_dec = decimal.Decimal(b_str)
        result = a_dec + b_dec
        return str(result)

def generate_random_number(digits):
    """Generate a random number with the specified number of digits."""
    if digits <= 0:
        return "0"
    
    # First digit should not be 0
    first_digit = random.randint(1, 9)
    rest_digits = ''.join(str(random.randint(0, 9)) for _ in range(digits - 1))
    
    return str(first_digit) + rest_digits

def time_algorithm(algorithm, a, b, tries=3):
    """Time the execution of an algorithm with multiple tries for consistency."""
    total_time = 0
    result = None
    
    for _ in range(tries):
        start_time = time.perf_counter()
        result = algorithm(a, b)
        end_time = time.perf_counter()
        total_time += (end_time - start_time)
    
    avg_time = (total_time / tries) * 1000  # Convert to milliseconds
    return result, avg_time

def format_time(milliseconds):
    """Format time in milliseconds for display."""
    if milliseconds < 0.001:
        return "0.001"  # Show at least 0.001ms instead of 0.000
    return f"{milliseconds:.3f}"  # Show 3 decimal places for milliseconds

def validate_results(results):
    """Ensure all algorithms produce the same result."""
    if len(results) <= 1:
        return True
    
    first_result = results[0]
    return all(result == first_result for result in results)

def main():
    # Define algorithms to test
    algorithms = [
        ("GASING", gasing_addition),
        ("SEKOLAH", optimized_traditional_addition),
        ("ARRAY_BASIC", array_basic_addition),
        ("ARRAY_OPT", array_optimized_addition),
        ("ARRAY_CHUNK", array_chunk_addition),
        ("PYTHON_INT", python_int_addition),
        ("DECIMAL", decimal_addition)
    ]
    
    # Number of problems per digit size
    problems_per_size = 5
    
    # Generate test cases for different digit sizes
    test_cases = []
    
    for digits in range(1, 51):
        for _ in range(problems_per_size):
            a = generate_random_number(digits)
            b = generate_random_number(digits)
            test_cases.append((a, b, digits))  # Store the digit size with the test case
    
    # Print header
    print("\nHasil perbandingan antara algoritma-algoritma penjumlahan untuk 1-50 digit:")
    print("-" * 135)
    header = "No | Digits | A | B | Hasil | " + " | ".join(f"{alg[0]} (ms)" for alg in algorithms) + " | Validasi"
    print(header)
    print("-" * 135)
    
    # Process each test case
    for idx, (a, b, digits) in enumerate(test_cases, 1):
        # Calculate expected result for validation
        expected = str(int(a) + int(b))
        
        # Time each algorithm
        timings = []
        results = []
        
        for _, algorithm in algorithms:
            try:
                result, timing = time_algorithm(algorithm, a, b)
                results.append(result)
                timings.append(format_time(timing))
            except Exception as e:
                results.append("ERROR")
                timings.append("ERROR")
        
        # Validate results
        validation = "OK" if validate_results(results) else "MISMATCH"
        
        # Print results
        print(f"{idx:<3}| {digits:<6} | {a[:5]}{'...' if len(a) > 5 else '':3} | {b[:5]}{'...' if len(b) > 5 else '':3} | {expected[:5]}{'...' if len(expected) > 5 else '':3} | " + 
              " | ".join(timings) + f" | {validation}")
    
    print("-" * 135)
    print("Note: For long numbers, only first 5 digits are shown")

if __name__ == "__main__":
    main()
