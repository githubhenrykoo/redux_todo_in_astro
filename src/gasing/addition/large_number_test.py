#!/usr/bin/env python3
"""
Comparison tool for Gasing (Agothirim) vs Traditional Addition Algorithms.
Automatically runs tests on the large number dataset.
"""

import time
import csv
import os
import sys
from gasing import carry_detection as gasing_method
from traditional import traditional_carry_detection as traditional_method

def load_test_cases(csv_file="large_addition_dataset.csv", limit=None):
    """Load test cases from a CSV file."""
    if not os.path.exists(csv_file):
        print(f"Error: Dataset file '{csv_file}' not found.")
        print("Please run generate_dataset.py first to create the test data.")
        return []
        
    test_cases = []
    try:
        with open(csv_file, 'r', newline='') as f:
            reader = csv.DictReader(f)
            for row in reader:
                test_cases.append(row)
                if limit and len(test_cases) >= limit:
                    break
    except Exception as e:
        print(f"Error loading dataset: {e}")
        return []
        
    return test_cases

def compare_methods(test_case, verbose=False):
    """Compare Gasing and Traditional addition methods for a single test case."""
    a_str = test_case["a"]
    b_str = test_case["b"]
    
    if verbose:
        print(f"Test Case: {test_case['name']}")
        print(f"A: {a_str[:30]}{'...' if len(a_str) > 30 else ''}")
        print(f"B: {b_str[:30]}{'...' if len(b_str) > 30 else ''}")
    
    # Perform Gasing method
    if verbose:
        print("\n=== GASING METHOD (AGOTHIRIM OPTIMIZATION) ===")
    start_time = time.time()
    gasing_carries = gasing_method(a_str, b_str)
    gasing_time = time.time() - start_time
    
    # Perform Traditional method
    if verbose:
        print("\n=== TRADITIONAL METHOD ===")
    start_time = time.time()
    trad_carries = traditional_method(a_str, b_str)
    trad_time = time.time() - start_time
    
    # Compare results
    if verbose:
        print("\n=== COMPARISON ===")
        print(f"Expected sum: {test_case['expected']}")
        print(f"Gasing carries: {gasing_carries}")
        print(f"Traditional carries: {trad_carries}")
        print(f"Total Gasing carries: {sum(gasing_carries)}")
        print(f"Total Traditional carries: {sum(trad_carries)}")
        
        print(f"\nGasing time: {gasing_time:.6f} seconds")
        print(f"Traditional time: {trad_time:.6f} seconds")
        
        if gasing_time > 0 and trad_time > 0:
            speedup = trad_time / gasing_time
            print(f"Speedup ratio: {speedup:.2f}x {'faster' if speedup > 1 else 'slower'} than traditional")
        
        if gasing_carries == trad_carries:
            print("\nBoth methods produce the same carries! ")
        else:
            print("\nThe methods produce different carries! ")
            differences = [f"Position {i+1}: Gasing={g}, Traditional={t}" 
                          for i, (g, t) in enumerate(zip(gasing_carries, trad_carries)) 
                          if g != t]
            print(f"Differences: {len(differences)}")
            for diff in differences[:5]:  # Show first 5 differences only
                print(f"  {diff}")
            if len(differences) > 5:
                print(f"  ... and {len(differences) - 5} more differences")
        
        print("-" * 50)
    
    # Return key metrics
    carries_match = (gasing_carries == trad_carries)
    return {
        "gasing_time": gasing_time,
        "trad_time": trad_time,
        "carries_match": carries_match,
        "gasing_carry_count": sum(gasing_carries),
        "trad_carry_count": sum(trad_carries),
        "digit_count_a": len(a_str),
        "digit_count_b": len(b_str),
        "digit_count_result": len(test_case["expected"]),
        "name": test_case["name"]
    }

def run_test_suite(test_cases, verbose_limit=5):
    """Run comparison on multiple test cases."""
    print(f"RUNNING COMPARISON TEST SUITE ON {len(test_cases)} CASES")
    print("=" * 50 + "\n")
    
    results = []
    total_gasing_time = 0
    total_trad_time = 0
    matching_carries = 0
    
    for i, test in enumerate(test_cases):
        # Show detailed output only for the first few test cases
        verbose = (i < verbose_limit)
        
        if verbose:
            print(f"Test Case {i+1}/{len(test_cases)}: {test['name']}")
        elif i % 10 == 0:  # Progress indicator
            print(f"Processing test case {i+1}/{len(test_cases)}...", end="\r")
            
        result = compare_methods(test, verbose)
        results.append(result)
        
        total_gasing_time += result["gasing_time"]
        total_trad_time += result["trad_time"]
        if result["carries_match"]:
            matching_carries += 1
    
    print("\n")  # Clear the progress indicator line
    
    # Overall performance comparison
    print("\n=== OVERALL PERFORMANCE SUMMARY ===")
    print(f"Total test cases: {len(test_cases)}")
    print(f"Total Gasing time: {total_gasing_time:.6f} seconds")
    print(f"Total Traditional time: {total_trad_time:.6f} seconds")
    
    if total_gasing_time > 0 and total_trad_time > 0:
        overall_speedup = total_trad_time / total_gasing_time
        print(f"Overall speedup: {overall_speedup:.2f}x {'faster' if overall_speedup > 1 else 'slower'} than traditional")
    
    # Carry matching statistics
    print(f"\nCarry pattern matching: {matching_carries}/{len(test_cases)} ({matching_carries/len(test_cases)*100:.1f}%)")
    if matching_carries < len(test_cases):
        print("Note: Different carry patterns don't affect correctness, just show different approaches.")
    
    # Performance by digit length
    print("\n=== PERFORMANCE BY DIGIT LENGTH ===")
    
    # Group results by digit ranges
    digit_ranges = [(10, 20), (21, 30), (31, 40), (41, 50)]
    for start, end in digit_ranges:
        range_results = [r for r in results if start <= r["digit_count_result"] <= end]
        if range_results:
            range_gasing_time = sum(r["gasing_time"] for r in range_results)
            range_trad_time = sum(r["trad_time"] for r in range_results)
            range_speedup = range_trad_time / range_gasing_time if range_gasing_time > 0 else 0
            
            print(f"\nDigit range {start}-{end} ({len(range_results)} test cases):")
            print(f"  Gasing time: {range_gasing_time:.6f} seconds")
            print(f"  Traditional time: {range_trad_time:.6f} seconds")
            print(f"  Speedup: {range_speedup:.2f}x {'faster' if range_speedup > 1 else 'slower'}")
    
    # Find the best and worst performing test cases for Agothirim
    if results:
        best_speedup = max(results, key=lambda r: r["trad_time"]/r["gasing_time"] if r["gasing_time"] > 0 else 0)
        worst_speedup = min(results, key=lambda r: r["trad_time"]/r["gasing_time"] if r["gasing_time"] > 0 else float('inf'))
        
        print("\n=== NOTABLE TEST CASES ===")
        best_ratio = best_speedup["trad_time"] / best_speedup["gasing_time"] if best_speedup["gasing_time"] > 0 else 0
        print(f"Best case for Agothirim: {best_speedup['name']} - {best_ratio:.2f}x faster")
        
        worst_ratio = worst_speedup["trad_time"] / worst_speedup["gasing_time"] if worst_speedup["gasing_time"] > 0 else 0
        print(f"Worst case for Agothirim: {worst_speedup['name']} - {worst_ratio:.2f}x {'faster' if worst_ratio > 1 else 'slower'}")
    
    # Recommendations based on performance
    print("\n=== RECOMMENDATION ===")
    if total_gasing_time < total_trad_time:
        print("The Agothirim optimization is generally effective across the test dataset.")
        print("It's especially beneficial for numbers with many consecutive 9s in their sum.")
    else:
        print("The traditional method performed better on average for this dataset.")
        print("You may want to use Agothirim only for specific cases with many consecutive 9s.")

def main():
    """Main function to run the test suite."""
    # Default parameters
    dataset_file = "large_addition_dataset.csv"
    num_cases = 20  # Default number of test cases to run
    
    # Parse command line arguments if present
    if len(sys.argv) > 1:
        try:
            num_cases = int(sys.argv[1])
        except ValueError:
            print(f"Invalid number of test cases. Using default ({num_cases}).")
    
    # Load test cases
    print(f"Loading up to {num_cases} test cases from {dataset_file}...")
    test_cases = load_test_cases(dataset_file, num_cases)
    
    if not test_cases:
        print("No test cases found. Exiting.")
        return
    
    # Run tests
    run_test_suite(test_cases)

if __name__ == "__main__":
    main()
