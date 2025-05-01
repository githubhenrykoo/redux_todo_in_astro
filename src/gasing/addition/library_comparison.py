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
import datetime
import cProfile
import pstats
import io
from decimal import Decimal

# Set precision high enough for our large numbers
decimal.getcontext().prec = 100

def load_test_cases(csv_file):
    """Load test cases from CSV file."""
    test_cases = []
    with open(csv_file, 'r') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            # Check for required fields
            if 'a' not in row or 'b' not in row:
                print(f"Warning: Row {i+1} missing required fields 'a' or 'b'. Skipping.")
                continue
                
            # Handle missing 'digits' column by calculating from a and b
            if 'digits' not in row:
                digits = max(len(row['a']), len(row['b']))
            else:
                try:
                    digits = int(row['digits']) 
                except ValueError:
                    digits = max(len(row['a']), len(row['b']))
                    print(f"Warning: Row {i+1} has invalid 'digits' value. Using calculated length: {digits}")
                    
            # Handle other possible missing columns
            name = row.get('name', f"TestCase_{i+1}")
            expected = row.get('expected', None)
            
            # If expected sum is missing, compute it for verification
            if not expected:
                try:
                    expected = str(int(row['a']) + int(row['b']))
                except ValueError:
                    # For very large numbers, use Gasing addition as fallback
                    from gasingaddition import table_based_addition_optimized
                    expected = table_based_addition_optimized(row['a'], row['b'])
                    print(f"Warning: Row {i+1} missing 'expected' value. Calculated sum.")
                
            test_cases.append({
                'name': name,
                'digits': digits,
                'a': row['a'],
                'b': row['b'],
                'expected_sum': expected
            })
    
    print(f"Loaded {len(test_cases)} test cases from {csv_file}")
    return test_cases

def main():
    """Run the benchmark comparison."""
    try:
        # Load all test cases without limiting the number
        test_cases = load_test_cases('large_addition_dataset.csv')
        # Run benchmark with all test cases
        run_benchmark(test_cases, output_dir="testoutput")
    except FileNotFoundError:
        print("Error: Dataset file 'large_addition_dataset.csv' not found.")
        print("Please run generate_dataset.py first to create the dataset.")
        sys.exit(1)

def python_int_addition(a_str, b_str):
    """Run Python's built-in integer addition."""
    import sys
    from gasingaddition import table_based_addition_optimized
    
    start_time = time.time()
    try:
        # Try to increase the limit if needed
        if max(len(a_str), len(b_str)) >= 4300:
            old_limit = sys.get_int_max_str_digits()
            sys.set_int_max_str_digits(max(len(a_str), len(b_str)) + 10)
            
        a_int = int(a_str)
        b_int = int(b_str)
        result = str(a_int + b_int)
        
        # Restore original limit if we changed it
        if max(len(a_str), len(b_str)) >= 4300:
            sys.set_int_max_str_digits(old_limit)
    except (ValueError, OverflowError):
        # Fallback to Gasing addition
        result = table_based_addition_optimized(a_str, b_str)
    
    end_time = time.time()
    return result, end_time - start_time

def decimal_addition(a_str, b_str):
    """Run decimal module addition."""
    from decimal import Decimal, getcontext
    from gasingaddition import table_based_addition_optimized
    
    start_time = time.time()
    try:
        getcontext().prec = max(len(a_str), len(b_str)) + 10
        a_dec = Decimal(a_str)
        b_dec = Decimal(b_str)
        result = a_dec + b_dec
        result_str = str(result)
    except (ValueError, OverflowError):
        # Fallback to Gasing addition
        result_str = table_based_addition_optimized(a_str, b_str)
    
    end_time = time.time()
    return result_str, end_time - start_time

def gasing_addition(a_str, b_str):
    """Addition using our custom Gasing/Agothirim algorithm."""
    from gasingaddition import gasing_addition as ga_optimized_implementation
    start_time = time.time()
    result = ga_optimized_implementation(a_str, b_str)
    end_time = time.time()
    return result, end_time - start_time

def traditional_addition(a_str, b_str):
    """
    Addition using the traditional right-to-left algorithm.
    Optimized to skip carry detection and directly add the numbers.
    """
    from traditional import optimized_traditional_addition
    from gasingaddition import table_based_addition_optimized
    
    start_time = time.time()
    try:
        result = optimized_traditional_addition(a_str, b_str)
    except ValueError as e:
        if "Exceeds the limit" in str(e):
            # Fallback to Gasing addition if we exceed Python's int limit
            result = table_based_addition_optimized(a_str, b_str)
        else:
            raise
    end_time = time.time()
    elapsed = end_time - start_time
    return result, elapsed

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
    
    # Add timestamp to filename with improved formatting
    timestamp = datetime.datetime.now().strftime("%Y.%m.%d.%H:%M:%S")
    output_filename = f"benchmark_results_{timestamp}.txt"
    output_path = os.path.join(output_dir, output_filename)
    
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
    with open(output_path, "w") as f:
        f.write("=== ALGORITHM BENCHMARK RESULTS ===\n\n")
        
        # Write overall performance chart
        f.write(overall_chart + "\n\n")
        
        # Write per-digit-range charts - ensure all ranges are shown
        f.write("=== PERFORMANCE BY DIGIT LENGTH ===\n\n")
        for chart in range_charts:
            f.write(chart + "\n\n")
        
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
    
    return overall_chart

def run_benchmark(test_cases, verbose=True, output_dir="testoutput"):
    """Run benchmarks on all algorithms."""
    results = {
        'gasing': {'total_time': 0, 'correct': 0},
        'traditional': {'total_time': 0, 'correct': 0},
        'python_int': {'total_time': 0, 'correct': 0},
        'decimal': {'total_time': 0, 'correct': 0}
    }
    
    # Update digit ranges to match our dataset
    digit_ranges = {
        '1': {'count': 0, 'gasing': 0, 'traditional': 0, 'python_int': 0, 'decimal': 0},
        '5': {'count': 0, 'gasing': 0, 'traditional': 0, 'python_int': 0, 'decimal': 0},
        '10': {'count': 0, 'gasing': 0, 'traditional': 0, 'python_int': 0, 'decimal': 0},
        '50': {'count': 0, 'gasing': 0, 'traditional': 0, 'python_int': 0, 'decimal': 0},
        '100': {'count': 0, 'gasing': 0, 'traditional': 0, 'python_int': 0, 'decimal': 0},
        '500': {'count': 0, 'gasing': 0, 'traditional': 0, 'python_int': 0, 'decimal': 0},
        '1000': {'count': 0, 'gasing': 0, 'traditional': 0, 'python_int': 0, 'decimal': 0},
        '5000': {'count': 0, 'gasing': 0, 'traditional': 0, 'python_int': 0, 'decimal': 0},
        '10000': {'count': 0, 'gasing': 0, 'traditional': 0, 'python_int': 0, 'decimal': 0}
    }
    
    if verbose:
        print(f"RUNNING LIBRARY COMPARISON BENCHMARK ON {len(test_cases)} CASES")
        print("=" * 50)
    
    # Sample data for profiling (use a subset of test cases)
    profile_sample_size = min(5, len(test_cases))  # Reduced sample size since we'll run many more iterations
    profile_samples = test_cases[:profile_sample_size]
    profile_iterations = 100000  # Run 100,000 iterations for more accurate profiling
    
    # Profile each algorithm separately
    print("\n=== RUNNING DETAILED PROFILING ({:,} iterations) ===".format(profile_iterations))
    
    # Profile Gasing Addition
    print("Profiling Gasing Addition...")
    pr_gasing = cProfile.Profile()
    pr_gasing.enable()
    # Use just the first case for repeated iterations (to ensure we're profiling algorithm not sample loading)
    sample_case = profile_samples[0]
    for _ in range(profile_iterations):
        gasing_addition(sample_case['a'], sample_case['b'])
    pr_gasing.disable()
    
    # Profile Traditional Addition 
    print("Profiling Traditional Addition...")
    pr_trad = cProfile.Profile()
    pr_trad.enable()
    for _ in range(profile_iterations):
        traditional_addition(sample_case['a'], sample_case['b'])
    pr_trad.disable()
    
    # Profile Python Int Addition
    print("Profiling Python Int Addition...")
    pr_int = cProfile.Profile()
    pr_int.enable()
    for _ in range(profile_iterations):
        python_int_addition(sample_case['a'], sample_case['b'])
    pr_int.disable()
    
    # Profile Decimal Addition
    print("Profiling Decimal Addition...")
    pr_dec = cProfile.Profile()
    pr_dec.enable()
    for _ in range(profile_iterations):
        decimal_addition(sample_case['a'], sample_case['b'])
    pr_dec.disable()
    
    # Now run the full benchmark as before
    for i, case in enumerate(test_cases):
        a, b = case['a'], case['b']
        expected = case['expected_sum']
        # Extract digits from the length of the number instead of trying to access 'digits' key
        max_len = max(len(a), len(b))
        
        # Find the closest digit range
        range_key = None
        for key in sorted(digit_ranges.keys(), key=int):
            if max_len <= int(key):
                range_key = key
                break
        if not range_key:
            range_key = max(digit_ranges.keys(), key=int)
        
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
    
    # Get the filename with timestamp
    timestamp = datetime.datetime.now().strftime("%Y.%m.%d.%H:%M:%S")
    output_filename = f"benchmark_results_{timestamp}.txt"
    benchmark_file_path = os.path.join(output_path, output_filename)
    
    # Save profiling results
    print("\n=== SAVING DETAILED PROFILING RESULTS ===")
    
    # Create a sorting function (by cumulative time)
    def sort_stats(stats):
        return stats.sort_stats(pstats.SortKey.CUMULATIVE)
    
    # Process and save each profile
    profile_data = {
        'gasing': (pr_gasing, 'gasing_profile.txt'),
        'traditional': (pr_trad, 'traditional_profile.txt'),
        'python_int': (pr_int, 'python_int_profile.txt'),
        'decimal': (pr_dec, 'decimal_profile.txt')
    }
    
    for name, (profiler, filename) in profile_data.items():
        # Create string buffer and save stats
        s = io.StringIO()
        ps = sort_stats(pstats.Stats(profiler, stream=s))
        ps.print_stats(40)  # Show top 40 functions by time for more detail
        
        # Save to file
        profile_path = os.path.join(output_path, filename)
        with open(profile_path, 'w') as f:
            f.write(f"DETAILED PROFILE FOR {name.upper()} ALGORITHM\n")
            f.write(f"Running {profile_iterations:,} iterations on input size: {len(sample_case['a'])} digits\n")
            f.write("=" * 50 + "\n\n")
            f.write(s.getvalue())
        
        print(f"Saved {name} profile to {profile_path}")
    
    print(f"\nDetailed results saved to {benchmark_file_path}")
    print("\nASCII Performance Chart:")
    print(chart)

if __name__ == '__main__':
    main()
