#!/usr/bin/env python3
"""
Benchmark comparing various addition algorithms, including:
1. Our custom Gasing/Agothirim algorithm
2. Traditional right-to-left addition (optimized)
3. Python's built-in int type
4. decimal.Decimal from the standard library
"""

import csv
import sys
import time
import decimal
import os
from decimal import Decimal

# Set precision high enough for our large numbers
decimal.getcontext().prec = 100

def load_test_cases(filepath, limit=None):
    """Load test cases from a CSV file."""
    test_cases = []
    with open(filepath, 'r') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if limit is not None and i >= limit:
                break
            test_cases.append({
                'name': row['name'],
                'a': row['a'],
                'b': row['b'],
                'expected_sum': row['expected']
            })
    return test_cases

def python_int_addition(a_str, b_str):
    """Addition using Python's built-in int type."""
    start_time = time.time()
    a_int = int(a_str)
    b_int = int(b_str)
    result = a_int + b_int
    end_time = time.time()
    return str(result), end_time - start_time

def decimal_addition(a_str, b_str):
    """Addition using Python's decimal.Decimal type."""
    start_time = time.time()
    a_dec = Decimal(a_str)
    b_dec = Decimal(b_str)
    result = a_dec + b_dec
    end_time = time.time()
    return str(result), end_time - start_time

def gasing_addition(a_str, b_str):
    """Addition using our custom Gasing/Agothirim algorithm."""
    from gasing import carry_detection, calculate_sum
    start_time = time.time()
    carry = carry_detection(a_str, b_str, verbose=False)
    result = calculate_sum(a_str, b_str, carry)
    end_time = time.time()
    return result, end_time - start_time

def traditional_addition(a_str, b_str):
    """
    Addition using the traditional right-to-left algorithm.
    Optimized to skip carry detection and directly add the numbers.
    """
    start_time = time.time()
    
    # Convert to lists of digits
    a_digits = [int(d) for d in a_str]
    b_digits = [int(d) for d in b_str]
    
    # Pad to same length
    max_len = max(len(a_digits), len(b_digits))
    a_padded = [0] * (max_len - len(a_digits)) + a_digits
    b_padded = [0] * (max_len - len(b_digits)) + b_digits
    
    # Traditional right-to-left addition
    result_digits = []
    carry = 0
    
    for i in range(max_len - 1, -1, -1):  # Start from the right
        digit_sum = a_padded[i] + b_padded[i] + carry
        result_digits.insert(0, digit_sum % 10)  # Insert at beginning
        carry = digit_sum // 10
    
    # Handle final carry
    if carry > 0:
        result_digits.insert(0, carry)
    
    # Convert back to string
    result = ''.join(map(str, result_digits))
    
    end_time = time.time()
    return result, end_time - start_time

def create_ascii_bar_chart(values, labels, title, max_width=50):
    """Create a simple ASCII bar chart."""
    result = [title]
    result.append("=" * len(title))
    result.append("")
    
    # Find the maximum value for scaling
    max_value = max(values)
    
    # Find the longest label for alignment
    max_label_len = max(len(label) for label in labels)
    
    # Create each bar
    for i, value in enumerate(values):
        # Scale the bar length to max_width
        bar_length = int((value / max_value) * max_width) if max_value > 0 else 0
        bar = "#" * bar_length
        
        # Format with label and value
        label = labels[i].ljust(max_label_len)
        result.append(f"{label} | {bar} {value:.6f}s")
    
    return "\n".join(result)

def create_text_visualizations(results, digit_ranges, output_dir):
    """Create text-based visualizations of benchmark results."""
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Prepare data for overall performance
    algorithms = list(results.keys())
    times = [results[algo]['total_time'] for algo in algorithms]
    
    # Create ASCII bar chart for overall performance
    overall_chart = create_ascii_bar_chart(
        times, 
        algorithms,
        "OVERALL PERFORMANCE (Lower is better)"
    )
    
    # Create ASCII bar charts for each digit range
    range_charts = []
    for range_name, data in sorted(digit_ranges.items()):
        if data['count'] > 0:
            # Calculate average times
            algo_names = ['gasing', 'traditional', 'python_int', 'decimal']
            avg_times = [data[algo]/data['count'] for algo in algo_names]
            
            range_chart = create_ascii_bar_chart(
                avg_times,
                algo_names,
                f"DIGIT RANGE {range_name} - {data['count']} test cases (Lower is better)"
            )
            range_charts.append(range_chart)
    
    # Save to files
    with open(f"{output_dir}/benchmark_results.txt", "w") as f:
        f.write("=== ALGORITHM BENCHMARK RESULTS ===\n\n")
        
        # Write overall performance chart
        f.write(overall_chart)
        f.write("\n\n")
        
        # Write detailed performance by digit range
        f.write("=== PERFORMANCE BY DIGIT LENGTH ===\n\n")
        for chart in range_charts:
            f.write(chart)
            f.write("\n\n")
        
        # Write accuracy results
        f.write("=== ACCURACY RESULTS ===\n")
        for algo, data in results.items():
            f.write(f"{algo.capitalize()}: {data['correct']}/{sum(digit_ranges[r]['count'] for r in digit_ranges)} correct\n")
        
        # Write speedup comparisons
        f.write("\n=== SPEEDUP COMPARISON ===\n")
        fastest_algo = min(results.items(), key=lambda x: x[1]['total_time'])[0]
        f.write(f"Fastest algorithm: {fastest_algo.capitalize()}\n")
        
        for algo, data in results.items():
            if algo != fastest_algo:
                speedup = data['total_time'] / results[fastest_algo]['total_time']
                f.write(f"{fastest_algo.capitalize()} is {speedup:.2f}x faster than {algo}\n")
    
    # Create a copy in the current directory for easy viewing
    with open(f"benchmark_results.txt", "w") as f:
        f.write(open(f"{output_dir}/benchmark_results.txt").read())
    
    return overall_chart

def run_benchmark(test_cases, verbose=True, output_dir="testoutput"):
    """Run benchmarks on all algorithms."""
    results = {
        'gasing': {'total_time': 0, 'correct': 0},
        'traditional': {'total_time': 0, 'correct': 0},
        'python_int': {'total_time': 0, 'correct': 0},
        'decimal': {'total_time': 0, 'correct': 0}
    }
    
    digit_ranges = {
        '10-20': {'count': 0, 'gasing': 0, 'traditional': 0, 'python_int': 0, 'decimal': 0},
        '21-30': {'count': 0, 'gasing': 0, 'traditional': 0, 'python_int': 0, 'decimal': 0},
        '31-40': {'count': 0, 'gasing': 0, 'traditional': 0, 'python_int': 0, 'decimal': 0},
        '41-50': {'count': 0, 'gasing': 0, 'traditional': 0, 'python_int': 0, 'decimal': 0}
    }
    
    if verbose:
        print(f"RUNNING LIBRARY COMPARISON BENCHMARK ON {len(test_cases)} CASES")
        print("=" * 50)
    
    for i, case in enumerate(test_cases):
        a, b = case['a'], case['b']
        expected = case['expected_sum']
        max_len = max(len(a), len(b))
        
        # Determine digit range
        range_key = None
        if max_len <= 20:
            range_key = '10-20'
        elif max_len <= 30:
            range_key = '21-30'
        elif max_len <= 40:
            range_key = '31-40'
        else:
            range_key = '41-50'
        
        digit_ranges[range_key]['count'] += 1
        
        if verbose and i < 3:  # Detailed output for first 3 cases
            print(f"\nTest Case {i+1}/{len(test_cases)}: {case['name']}")
            print(f"A: {a[:30]}{'...' if len(a) > 30 else ''}")
            print(f"B: {b[:30]}{'...' if len(b) > 30 else ''}")
            print(f"Expected Sum: {expected[:30]}{'...' if len(expected) > 30 else ''}")
            print("\nResults:")
        
        # Test each algorithm
        gasing_result, gasing_time = gasing_addition(a, b)
        results['gasing']['total_time'] += gasing_time
        digit_ranges[range_key]['gasing'] += gasing_time
        if gasing_result == expected:
            results['gasing']['correct'] += 1
        
        trad_result, trad_time = traditional_addition(a, b)
        results['traditional']['total_time'] += trad_time
        digit_ranges[range_key]['traditional'] += trad_time
        if trad_result == expected:
            results['traditional']['correct'] += 1
        
        int_result, int_time = python_int_addition(a, b)
        results['python_int']['total_time'] += int_time
        digit_ranges[range_key]['python_int'] += int_time
        if int_result == expected:
            results['python_int']['correct'] += 1
        
        dec_result, dec_time = decimal_addition(a, b)
        results['decimal']['total_time'] += dec_time
        digit_ranges[range_key]['decimal'] += dec_time
        if dec_result == expected:
            results['decimal']['correct'] += 1
        
        if verbose and i < 3:
            print(f"  Gasing:      {gasing_time:.6f}s {'✓' if gasing_result == expected else '✗'}")
            print(f"  Traditional: {trad_time:.6f}s {'✓' if trad_result == expected else '✗'}")
            print(f"  Python int:  {int_time:.6f}s {'✓' if int_result == expected else '✗'}")
            print(f"  Decimal:     {dec_time:.6f}s {'✓' if dec_result == expected else '✗'}")
        elif verbose and i % 10 == 0:
            print(f"Processed {i+1}/{len(test_cases)} test cases...")
    
    # Print summary
    print("\n=== OVERALL PERFORMANCE SUMMARY ===")
    print(f"Total test cases: {len(test_cases)}")
    for algo, data in results.items():
        print(f"{algo.capitalize()}: {data['total_time']:.6f}s, {data['correct']}/{len(test_cases)} correct")
    
    # Calculate speedups
    fastest_algo = min(results.items(), key=lambda x: x[1]['total_time'])[0]
    print(f"\nFastest algorithm: {fastest_algo.capitalize()}")
    
    for algo, data in results.items():
        if algo != fastest_algo:
            speedup = data['total_time'] / results[fastest_algo]['total_time']
            print(f"{fastest_algo.capitalize()} is {speedup:.2f}x faster than {algo}")
    
    # Performance by digit range
    print("\n=== PERFORMANCE BY DIGIT LENGTH ===")
    for range_name, data in digit_ranges.items():
        if data['count'] > 0:
            print(f"\nDigit range {range_name} ({data['count']} test cases):")
            for algo in ['gasing', 'traditional', 'python_int', 'decimal']:
                print(f"  {algo.capitalize()}: {data[algo]:.6f}s")
            
            fastest = min(['gasing', 'traditional', 'python_int', 'decimal'], 
                         key=lambda x: data[x] if data[x] > 0 else float('inf'))
            
            print(f"  Fastest in this range: {fastest.capitalize()}")
    
    # Create visualizations
    output_path = os.path.join("/Users/Henrykoo/Documents/redux_todo_in_astro/src/gasing/addition", output_dir)
    chart = create_text_visualizations(results, digit_ranges, output_path)
    
    print(f"\nDetailed results saved to {output_path}/benchmark_results.txt")
    print("\nASCII Performance Chart:")
    print(chart)

def main():
    # Default to 20 test cases
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 20
    
    try:
        test_cases = load_test_cases('large_addition_dataset.csv', limit)
        run_benchmark(test_cases, output_dir="testoutput")
    except FileNotFoundError:
        print("Error: Dataset file 'large_addition_dataset.csv' not found.")
        print("Please run generate_dataset.py first to create the dataset.")
        sys.exit(1)

if __name__ == '__main__':
    main()
