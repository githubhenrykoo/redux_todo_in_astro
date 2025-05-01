#!/usr/bin/env python3
"""
Benchmark the digit_division and traditional_long_division algorithms against a dataset of test cases.
Saves detailed performance metrics to the testoutput directory.
"""

import os
import csv
import time
import json
import datetime
import statistics
from divison2to9 import digit_division
from traditional_division import traditional_long_division
import cProfile
import pstats
import io

# Constants
DATASET_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "division_dataset.csv")
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "testoutput")
RESULTS_SUMMARY_FILE = os.path.join(OUTPUT_DIR, "benchmark_summary.txt")
RESULTS_CSV_FILE = os.path.join(OUTPUT_DIR, "benchmark_results.csv")
PROFILE_RESULTS_FILE = os.path.join(OUTPUT_DIR, "profile_results.txt")
DETAILED_JSON_FILE = os.path.join(OUTPUT_DIR, "detailed_benchmark.json")

def load_test_cases(dataset_path):
    """Load test cases from the CSV dataset."""
    test_cases = []
    try:
        with open(dataset_path, 'r', newline='') as f:
            reader = csv.DictReader(f)
            for row in reader:
                test_cases.append({
                    'name': row['name'],
                    'digits': int(row['digits']),
                    'dividend': int(row['dividend']),
                    'divisor': int(row['divisor']),
                    'expected': int(row['expected'])
                })
        print(f"Loaded {len(test_cases)} test cases from {dataset_path}")
        return test_cases
    except Exception as e:
        print(f"Error loading test cases: {e}")
        return []

def run_benchmark(test_cases, iterations=10):
    """Run benchmark on the test cases with specified iterations for both algorithms."""
    results = []
    execution_times_digit = []
    execution_times_traditional = []
    correct_results_digit = 0
    incorrect_results_digit = 0
    correct_results_traditional = 0
    incorrect_results_traditional = 0
    
    print(f"Running benchmark with {iterations} iterations per test case...")
    
    for i, test_case in enumerate(test_cases):
        dividend = test_case['dividend']
        divisor = test_case['divisor']
        expected = test_case['expected']
        # --- digit_division ---
        start_time = time.time()
        for _ in range(iterations):
            result_digit = digit_division(dividend, divisor)
        end_time = time.time()
        total_time_digit = end_time - start_time
        avg_time_digit = total_time_digit / iterations
        execution_times_digit.append(avg_time_digit)
        correct_digit = (result_digit == expected)
        if correct_digit:
            correct_results_digit += 1
        else:
            incorrect_results_digit += 1
        # --- traditional_long_division ---
        start_time = time.time()
        for _ in range(iterations):
            result_traditional, _ = traditional_long_division(dividend, divisor, verbose=False)
        end_time = time.time()
        total_time_traditional = end_time - start_time
        avg_time_traditional = total_time_traditional / iterations
        execution_times_traditional.append(avg_time_traditional)
        correct_traditional = (result_traditional == expected)
        if correct_traditional:
            correct_results_traditional += 1
        else:
            incorrect_results_traditional += 1
        # --- Record ---
        results.append({
            'test_case_name': test_case['name'],
            'dividend': dividend,
            'divisor': divisor,
            'expected': expected,
            'result_digit': result_digit,
            'result_traditional': result_traditional,
            'correct_digit': correct_digit,
            'correct_traditional': correct_traditional,
            'avg_time_digit': avg_time_digit,
            'avg_time_traditional': avg_time_traditional
        })
        if (i + 1) % 100 == 0 or i == 0 or i == len(test_cases) - 1:
            print(f"Processed {i+1}/{len(test_cases)} test cases...")
    # Metrics for both
    accuracy_digit = correct_results_digit / len(test_cases) * 100
    accuracy_traditional = correct_results_traditional / len(test_cases) * 100
    avg_execution_time_digit = statistics.mean(execution_times_digit)
    min_execution_time_digit = min(execution_times_digit)
    max_execution_time_digit = max(execution_times_digit)
    median_execution_time_digit = statistics.median(execution_times_digit)
    avg_execution_time_traditional = statistics.mean(execution_times_traditional)
    min_execution_time_traditional = min(execution_times_traditional)
    max_execution_time_traditional = max(execution_times_traditional)
    median_execution_time_traditional = statistics.median(execution_times_traditional)
    performance_metrics = {
        'total_test_cases': len(test_cases),
        'correct_results_digit': correct_results_digit,
        'incorrect_results_digit': incorrect_results_digit,
        'accuracy_digit': accuracy_digit,
        'avg_execution_time_digit': avg_execution_time_digit,
        'min_execution_time_digit': min_execution_time_digit,
        'max_execution_time_digit': max_execution_time_digit,
        'median_execution_time_digit': median_execution_time_digit,
        'correct_results_traditional': correct_results_traditional,
        'incorrect_results_traditional': incorrect_results_traditional,
        'accuracy_traditional': accuracy_traditional,
        'avg_execution_time_traditional': avg_execution_time_traditional,
        'min_execution_time_traditional': min_execution_time_traditional,
        'max_execution_time_traditional': max_execution_time_traditional,
        'median_execution_time_traditional': median_execution_time_traditional,
        'timestamp': datetime.datetime.now().isoformat()
    }
    return results, performance_metrics

def write_summary(performance_metrics, file_path):
    """Write a summary of the benchmark results for both algorithms."""
    with open(file_path, 'w') as f:
        f.write("DIVISION ALGORITHM BENCHMARK SUMMARY\n")
        f.write("==========================================\n\n")
        f.write(f"Timestamp: {performance_metrics['timestamp']}\n\n")
        f.write("Performance Metrics (digit_division):\n")
        f.write(f"Total test cases: {performance_metrics['total_test_cases']}\n")
        f.write(f"Correct results: {performance_metrics['correct_results_digit']}\n")
        f.write(f"Incorrect results: {performance_metrics['incorrect_results_digit']}\n")
        f.write(f"Accuracy: {performance_metrics['accuracy_digit']:.2f}%\n\n")
        f.write("Execution Time Metrics (digit_division):\n")
        f.write(f"Average execution time: {performance_metrics['avg_execution_time_digit']:.8f} seconds\n")
        f.write(f"Minimum execution time: {performance_metrics['min_execution_time_digit']:.8f} seconds\n")
        f.write(f"Maximum execution time: {performance_metrics['max_execution_time_digit']:.8f} seconds\n")
        f.write(f"Median execution time: {performance_metrics['median_execution_time_digit']:.8f} seconds\n\n")
        f.write("Performance Metrics (traditional_long_division):\n")
        f.write(f"Correct results: {performance_metrics['correct_results_traditional']}\n")
        f.write(f"Incorrect results: {performance_metrics['incorrect_results_traditional']}\n")
        f.write(f"Accuracy: {performance_metrics['accuracy_traditional']:.2f}%\n\n")
        f.write("Execution Time Metrics (traditional_long_division):\n")
        f.write(f"Average execution time: {performance_metrics['avg_execution_time_traditional']:.8f} seconds\n")
        f.write(f"Minimum execution time: {performance_metrics['min_execution_time_traditional']:.8f} seconds\n")
        f.write(f"Maximum execution time: {performance_metrics['max_execution_time_traditional']:.8f} seconds\n")
        f.write(f"Median execution time: {performance_metrics['median_execution_time_traditional']:.8f} seconds\n")
    print(f"Summary written to {file_path}")

def write_csv_results(results, file_path):
    """Write detailed results to a CSV file for both algorithms."""
    fieldnames = ['test_case_name', 'dividend', 'divisor', 'expected', 'result_digit', 'result_traditional',
                 'correct_digit', 'correct_traditional', 'avg_time_digit', 'avg_time_traditional']
    with open(file_path, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)
    print(f"Detailed results written to {file_path}")

def write_json_results(results, performance_metrics, file_path):
    """Write detailed results and metrics to a JSON file for both algorithms."""
    data = {
        'performance_metrics': performance_metrics,
        'test_results': results
    }
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"JSON results written to {file_path}")

def profile_algorithm(test_cases):
    """Profile the digit_division algorithm execution."""
    pr = cProfile.Profile()
    pr.enable()
    for i in range(min(100, len(test_cases))):
        digit_division(test_cases[i]['dividend'], test_cases[i]['divisor'])
    pr.disable()
    s = io.StringIO()
    ps = pstats.Stats(pr, stream=s).sort_stats('cumtime')
    ps.print_stats(20)
    with open(PROFILE_RESULTS_FILE, 'w') as f:
        f.write(s.getvalue())
    print(f"Profiling results written to {PROFILE_RESULTS_FILE}")

def main():
    """Main benchmark execution function."""
    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Load test cases
    test_cases = load_test_cases(DATASET_PATH)
    if not test_cases:
        print("No test cases loaded. Aborting benchmark.")
        return
    
    # Profile the algorithm
    print("Profiling algorithm...")
    profile_algorithm(test_cases)
    
    # Run benchmark
    results, performance_metrics = run_benchmark(test_cases)
    
    # Write results
    write_summary(performance_metrics, RESULTS_SUMMARY_FILE)
    write_csv_results(results, RESULTS_CSV_FILE)
    write_json_results(results, performance_metrics, DETAILED_JSON_FILE)
    
    # Display summary to console
    print("\nBENCHMARK SUMMARY:")
    print(f"Total test cases: {performance_metrics['total_test_cases']}")
    print(f"Accuracy (digit_division): {performance_metrics['accuracy_digit']:.2f}%")
    print(f"Accuracy (traditional_long_division): {performance_metrics['accuracy_traditional']:.2f}%")
    print(f"Average execution time (digit_division): {performance_metrics['avg_execution_time_digit']:.8f} seconds")
    print(f"Average execution time (traditional_long_division): {performance_metrics['avg_execution_time_traditional']:.8f} seconds")
    print(f"\nDetailed reports have been saved to: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
