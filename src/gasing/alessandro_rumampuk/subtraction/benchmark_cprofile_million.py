#!/usr/bin/env python3
"""
Comprehensive benchmark report for Gasing subtraction algorithm performance.
Uses 10,000 random samples from 1 million 5-digit subtraction problems,
repeating each 1,000 times for detailed profiling information.
"""

import csv
import cProfile
import pstats
import time
import os
import random
import io
import datetime
from additionmixsubtraction import gasing_subtraction_verbose
from decimal import Decimal

# Constants for benchmark
NUM_SAMPLES = 10000  # Number of samples from dataset
REPEAT_COUNT = 1000  # Number of times to repeat each subtraction
DETAILED_SAMPLE_SIZE = 100  # Number of cases to show detailed results for

def format_time(seconds):
    """Format time in appropriate units (ns, μs, ms, s)."""
    if seconds < 1e-6:
        return f"{seconds * 1e9:.3f} ns"
    elif seconds < 1e-3:
        return f"{seconds * 1e6:.3f} μs"
    elif seconds < 1:
        return f"{seconds * 1e3:.3f} ms"
    else:
        return f"{seconds:.6f} s"

def load_samples(dataset_path, num_samples):
    """Load random samples from the dataset."""
    all_cases = []
    
    with open(dataset_path, 'r') as f:
        reader = csv.reader(f)
        next(reader)  # Skip header
        all_rows = list(reader)
    
    total_cases = len(all_rows)
    if num_samples >= total_cases:
        samples = all_rows
    else:
        samples = random.sample(all_rows, num_samples)
    
    for case in samples:
        name, digits, a, b, expected = case
        all_cases.append({
            'name': name,
            'a': a,
            'b': b,
            'expected': expected
        })
    
    return all_cases, total_cases

def run_detailed_benchmarks(cases, repeat_count):
    """Run detailed benchmarks on each test case."""
    detailed_results = []
    total_time = 0
    correct = 0
    incorrect = 0
    
    for i, case in enumerate(cases):
        name = case['name']
        a = case['a']
        b = case['b']
        expected = case['expected']
        
        # Time the operation
        start_time = time.time()
        
        for _ in range(repeat_count):
            result = gasing_subtraction_verbose(a, b, verbose=False)
        
        elapsed = time.time() - start_time
        avg_time = elapsed / repeat_count
        total_time += elapsed
        
        # Check correctness (only for cases where expected is not N/A)
        if expected != "N/A" and result == expected:
            correct += 1
        elif expected != "N/A":
            incorrect += 1
        
        # Store detailed results
        detailed_results.append({
            'index': i + 1,
            'name': name,
            'a': a,
            'b': b,
            'time': avg_time,
            'total_time': elapsed,
            'result': result,
            'expected': expected,
            'correct': expected == "N/A" or result == expected
        })
    
    return detailed_results, total_time, correct, incorrect

def run_profile_benchmark(cases, repeat_count):
    """Run benchmarks with cProfile."""
    # Create profiler
    profiler = cProfile.Profile()
    profiler.enable()
    
    # Track time manually as well
    start_time = time.time()
    operations = 0
    
    # Run the algorithm on each test case
    for case in cases:
        a = case['a']
        b = case['b']
        
        # Run multiple times for better profiling data
        for _ in range(repeat_count):
            gasing_subtraction_verbose(a, b, verbose=False)
            operations += 1
    
    # Disable profiler
    profiler.disable()
    
    # Calculate total time
    elapsed = time.time() - start_time
    
    return profiler, elapsed, operations

def generate_report(detailed_results, total_time, operations, profile_stats, correct, incorrect, samples, total_cases):
    """Generate a comprehensive benchmark report."""
    report = []
    
    # Report header
    report.append("# Gasing Subtraction Algorithm Benchmark Report")
    report.append("")
    report.append(f"## Introduction")
    report.append("")
    report.append("This report presents a benchmark analysis of the Gasing subtraction algorithm for 5-digit integers.")
    report.append("The goal is to evaluate computational efficiency and correctness by measuring execution times")
    report.append(f"across {DETAILED_SAMPLE_SIZE} random test cases (shown in detail), as well as profiling")
    report.append(f"the algorithm for {REPEAT_COUNT} iterations on {NUM_SAMPLES} test cases.")
    report.append("")
    report.append("## Benchmark Configuration")
    report.append("")
    report.append(f"- **Test Dataset**: 1 million 5-digit subtraction problems")
    report.append(f"- **Sample Size**: {NUM_SAMPLES:,} random samples from {total_cases:,} total cases")
    report.append(f"- **Iterations per Sample**: {REPEAT_COUNT:,}")
    report.append(f"- **Total Operations**: {operations:,}")
    report.append(f"- **Date**: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report.append("")
    report.append("## Performance Summary")
    report.append("")
    report.append(f"- **Total Benchmark Time**: {format_time(total_time)}")
    report.append(f"- **Average Time per Operation**: {format_time(total_time/operations)}")
    
    if correct + incorrect > 0:
        accuracy = correct / (correct + incorrect) * 100
        report.append(f"- **Correctness**: {correct}/{correct+incorrect} ({accuracy:.2f}%)")
    
    report.append("")
    report.append("## Detailed Profile (Top Functions)")
    report.append("")
    report.append("```")
    s = io.StringIO()
    ps = pstats.Stats(profile_stats, stream=s).sort_stats('cumtime')
    ps.print_stats(10)
    report.append(s.getvalue())
    report.append("```")
    
    report.append("")
    report.append("## Detailed Results")
    report.append("")
    report.append("Showing results for the first 100 test cases:")
    report.append("")
    report.append("| No. | A | B | Time | Status |")
    report.append("|-----|-------------|-------------|--------------|--------|")
    
    for result in detailed_results[:DETAILED_SAMPLE_SIZE]:
        a_truncated = result['a'][:10] + "..." if len(result['a']) > 13 else result['a']
        b_truncated = result['b'][:10] + "..." if len(result['b']) > 13 else result['b']
        status = "✓" if result['correct'] else "✗"
        report.append(f"| {result['index']:3d} | {a_truncated:13s} | {b_truncated:13s} | {format_time(result['time']):14s} | {status:6s} |")
    
    return "\n".join(report)

def run_comprehensive_benchmark(dataset_path=None):
    """Run a comprehensive benchmark and generate a report."""
    # Default dataset path
    if dataset_path is None:
        dataset_path = "src/gasing/subtraction/million_5digit_subtraction_dataset.csv"
    
    print(f"GASING SUBTRACTION ALGORITHM - COMPREHENSIVE BENCHMARK")
    print("=" * 60)
    print(f"Configuration:")
    print(f"- Samples: {NUM_SAMPLES:,} random cases")
    print(f"- Repetitions: {REPEAT_COUNT:,} per case")
    print(f"- Dataset: {dataset_path}")
    print("=" * 60)
    
    # Load test cases
    print(f"Loading samples from dataset...")
    samples, total_cases = load_samples(dataset_path, NUM_SAMPLES)
    print(f"Loaded {len(samples):,} random samples from {total_cases:,} total cases")
    
    # Run detailed benchmarks on a subset of cases
    print(f"\nRunning detailed benchmarks on {DETAILED_SAMPLE_SIZE} cases...")
    detailed_results, detailed_time, correct, incorrect = run_detailed_benchmarks(
        samples[:DETAILED_SAMPLE_SIZE], REPEAT_COUNT)
    
    # Run profiler on all samples
    print(f"\nRunning profiler benchmark on all {len(samples):,} samples, {REPEAT_COUNT:,} repetitions each...")
    print(f"This might take a while...")
    profiler, profile_time, operations = run_profile_benchmark(samples, REPEAT_COUNT)
    
    # Generate report
    print(f"\nGenerating comprehensive benchmark report...")
    report = generate_report(
        detailed_results, profile_time, operations, profiler, 
        correct, incorrect, len(samples), total_cases)
    
    # Save report to file
    report_file = "src/gasing/subtraction/benchmark_report.md"
    with open(report_file, 'w') as f:
        f.write(report)
    
    print(f"\nBenchmark complete!")
    print(f"Total operations: {operations:,}")
    print(f"Total time: {format_time(profile_time)}")
    print(f"Average time per operation: {format_time(profile_time/operations)}")
    print(f"\nReport saved to: {report_file}")
    
    return report

if __name__ == "__main__":
    run_comprehensive_benchmark()
