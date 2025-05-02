#!/usr/bin/env python3
"""
Comprehensive benchmark comparison of different subtraction algorithms:
1. Traditional Subtraction
2. Gasing Subtraction (Table-based)

Provides detailed performance metrics and profiling information.
"""

import cProfile
import pstats
import time
import random
import csv
import io
import os
import datetime
import sys
from decimal import Decimal

# Import both algorithms
from traditional_subtraction import tampilkan_pengurangan_bersusun
from additionmixsubtraction import gasing_subtraction_verbose

# Constants for benchmark
NUM_SAMPLES = 100  # Number of samples to show in detailed table
REPEAT_COUNT = 1000000  # Number of times to repeat for profiling
PROFILING_SAMPLES = 5  # Use small number of distinct inputs for profiling

class SubtractionBenchmark:
    def __init__(self, dataset_path=None):
        """Initialize the benchmark with a dataset path"""
        if dataset_path is None:
            self.dataset_path = "src/gasing/subtraction/million_5digit_subtraction_dataset.csv"
        else:
            self.dataset_path = dataset_path
            
    def load_samples(self, num_samples):
        """Load test cases from the dataset"""
        print(f"Loading {num_samples} test cases from dataset...")
        
        samples = []
        with open(self.dataset_path, 'r') as f:
            reader = csv.reader(f)
            next(reader)  # Skip header
            all_rows = list(reader)
            
        # Select samples
        total_cases = len(all_rows)
        if num_samples >= total_cases:
            selected_rows = all_rows
        else:
            selected_rows = random.sample(all_rows, num_samples)
            
        for row in selected_rows:
            name, digits, a, b, expected = row
            # Convert to integers for easier handling
            samples.append({
                'name': name,
                'a': a,
                'b': b,
                'expected': expected
            })
            
        print(f"Loaded {len(samples)} samples from {total_cases} total cases")
        return samples, total_cases
    
    def run_case_benchmarks(self, samples):
        """Run benchmarks on each test case for both algorithms"""
        results = []
        
        traditional_total_time = 0
        gasing_total_time = 0
        traditional_correct = 0
        gasing_correct = 0
        
        print(f"\nRunning detailed benchmarks on {len(samples)} test cases...")
        
        for i, case in enumerate(samples):
            name = case['name']
            a_str = case['a']
            b_str = case['b']
            expected = case['expected']
            
            # Convert to integers for traditional algorithm
            a_int = int(a_str)
            b_int = int(b_str)
            
            # Verify expected result if available
            if expected != "N/A":
                expected_result = expected
            else:
                try:
                    expected_result = str(int(a_str) - int(b_str))
                except:
                    expected_result = None
            
            # Time traditional subtraction
            start_time = time.time()
            try:
                # Capture output to suppress printing
                original_stdout = sys.stdout
                sys.stdout = io.StringIO()
                
                # Run traditional algorithm
                tampilkan_pengurangan_bersusun(a_int, b_int)
                
                # Restore stdout
                traditional_output = sys.stdout.getvalue()
                sys.stdout = original_stdout
                
                # Extract result from output
                lines = traditional_output.strip().split('\n')
                traditional_result = lines[-1].strip().split()[-1]
                
                traditional_correct_flag = (expected_result is None or traditional_result == expected_result)
                if traditional_correct_flag:
                    traditional_correct += 1
            except Exception as e:
                traditional_result = f"ERROR: {e}"
                traditional_correct_flag = False
                
            traditional_time = time.time() - start_time
            traditional_total_time += traditional_time
            
            # Time Gasing subtraction
            start_time = time.time()
            try:
                # Run Gasing algorithm
                gasing_result = gasing_subtraction_verbose(a_str, b_str, verbose=False)
                
                gasing_correct_flag = (expected_result is None or gasing_result == expected_result)
                if gasing_correct_flag:
                    gasing_correct += 1
            except Exception as e:
                gasing_result = f"ERROR: {e}"
                gasing_correct_flag = False
                
            gasing_time = time.time() - start_time
            gasing_total_time += gasing_time
            
            # Store results
            results.append({
                'index': i + 1,
                'name': name,
                'a': a_str,
                'b': b_str,
                'traditional_time': traditional_time,
                'gasing_time': gasing_time,
                'traditional_result': traditional_result,
                'gasing_result': gasing_result,
                'traditional_correct': traditional_correct_flag,
                'gasing_correct': gasing_correct_flag,
                'expected': expected_result
            })
            
            # Show progress for every 10 cases
            if (i + 1) % 10 == 0:
                print(f"Processed {i + 1}/{len(samples)} test cases...")
        
        summary = {
            'traditional_total_time': traditional_total_time,
            'gasing_total_time': gasing_total_time,
            'traditional_correct': traditional_correct,
            'gasing_correct': gasing_correct,
            'total_cases': len(samples)
        }
        
        return results, summary
    
    def run_profiling_benchmark(self, num_samples=PROFILING_SAMPLES, repetitions=REPEAT_COUNT):
        """Run profiling on both algorithms using a few representative cases"""
        print(f"\nRunning profiling with {num_samples} samples, {repetitions} repetitions each...")
        
        # Load a small number of representative cases
        samples, _ = self.load_samples(num_samples)
        
        # Profile traditional algorithm
        print(f"Profiling traditional subtraction algorithm...")
        traditional_profiler = cProfile.Profile()
        traditional_profiler.enable()
        
        traditional_start = time.time()
        traditional_ops = 0
        
        for case in samples:
            a_int = int(case['a'])
            b_int = int(case['b'])
            
            # Suppress output for fast profiling
            original_stdout = sys.stdout
            null_stdout = io.StringIO()
            
            # Repeat the calculation many times
            reps_per_case = repetitions // len(samples)
            for _ in range(reps_per_case):
                sys.stdout = null_stdout
                tampilkan_pengurangan_bersusun(a_int, b_int)
                sys.stdout = original_stdout
                traditional_ops += 1
        
        traditional_time = time.time() - traditional_start
        traditional_profiler.disable()
        
        # Profile Gasing algorithm
        print(f"Profiling Gasing subtraction algorithm...")
        gasing_profiler = cProfile.Profile()
        gasing_profiler.enable()
        
        gasing_start = time.time()
        gasing_ops = 0
        
        for case in samples:
            a_str = case['a']
            b_str = case['b']
            
            # Repeat the calculation many times
            reps_per_case = repetitions // len(samples)
            for _ in range(reps_per_case):
                gasing_subtraction_verbose(a_str, b_str, verbose=False)
                gasing_ops += 1
        
        gasing_time = time.time() - gasing_start
        gasing_profiler.disable()
        
        profile_results = {
            'traditional_profiler': traditional_profiler,
            'gasing_profiler': gasing_profiler,
            'traditional_time': traditional_time,
            'gasing_time': gasing_time,
            'traditional_ops': traditional_ops,
            'gasing_ops': gasing_ops
        }
        
        return profile_results
    
    def format_time(self, seconds):
        """Format time in appropriate units"""
        if seconds < 1e-6:
            return f"{seconds * 1e9:.3f} ns"
        elif seconds < 1e-3:
            return f"{seconds * 1e6:.3f} μs"
        elif seconds < 1:
            return f"{seconds * 1e3:.3f} ms"
        else:
            return f"{seconds:.6f} s"
    
    def generate_report(self, case_results, case_summary, profile_results, total_cases):
        """Generate a comprehensive report comparing the algorithms"""
        report = []
        
        # Report header
        report.append("# Subtraction Algorithm Benchmark Report")
        report.append("")
        report.append("## Introduction")
        report.append("")
        report.append("This report presents a benchmark comparison of two subtraction algorithms for 5-digit integers:")
        report.append("* **Traditional Subtraction**: Standard pen-and-paper algorithm with borrowing")
        report.append("* **Gasing Subtraction**: Optimized table-based algorithm with streamlined borrow chain processing")
        report.append("")
        report.append("The goal is to evaluate computational efficiency and correctness by measuring execution times")
        report.append(f"across {len(case_results)} random test cases, as well as profiling each method for {REPEAT_COUNT:,} iterations.")
        report.append("The results guide the selection of the most suitable subtraction algorithm for high-performance applications.")
        report.append("")
        
        # Summary section
        report.append("## Benchmark Results")
        report.append("")
        report.append("### Performance Summary")
        report.append("")
        report.append(f"* **Dataset**: 1 million 5-digit subtraction problems")
        report.append(f"* **Sample Size**: {len(case_results)} random samples from {total_cases:,} total cases")
        report.append(f"* **Profiling**: {REPEAT_COUNT:,} operations on {PROFILING_SAMPLES} test cases")
        report.append(f"* **Date**: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("")
        
        # Per algorithm summary
        trad_avg = case_summary['traditional_total_time'] / case_summary['total_cases']
        gasing_avg = case_summary['gasing_total_time'] / case_summary['total_cases']
        
        trad_profile_avg = profile_results['traditional_time'] / profile_results['traditional_ops']
        gasing_profile_avg = profile_results['gasing_time'] / profile_results['gasing_ops']
        
        speedup = trad_avg / gasing_avg if gasing_avg > 0 else float('inf')
        profile_speedup = trad_profile_avg / gasing_profile_avg if gasing_profile_avg > 0 else float('inf')
        
        report.append("### Summary of Total Execution Time")
        report.append("")
        report.append("| Method        | Total Time    | Avg Time/Case  | Correctness  |")
        report.append("|---------------|---------------|----------------|--------------|")
        report.append(f"| TRADITIONAL   | {self.format_time(case_summary['traditional_total_time'])} | {self.format_time(trad_avg)} | {case_summary['traditional_correct']}/{case_summary['total_cases']} ({case_summary['traditional_correct']/case_summary['total_cases']*100:.1f}%) |")
        report.append(f"| GASING        | {self.format_time(case_summary['gasing_total_time'])} | {self.format_time(gasing_avg)} | {case_summary['gasing_correct']}/{case_summary['total_cases']} ({case_summary['gasing_correct']/case_summary['total_cases']*100:.1f}%) |")
        report.append("")
        report.append(f"**Performance Ratio**: Gasing is **{speedup:.2f}x** faster than Traditional (per case)")
        report.append("")
        
        # Profiling results
        report.append("### Profiling (1,000,000 Operations)")
        report.append("")
        report.append("| Method        | Total Time    | Avg Time/Op    | Speedup      |")
        report.append("|---------------|---------------|----------------|--------------|")
        report.append(f"| TRADITIONAL   | {self.format_time(profile_results['traditional_time'])} | {self.format_time(trad_profile_avg)} | 1.00x  |")
        report.append(f"| GASING        | {self.format_time(profile_results['gasing_time'])} | {self.format_time(gasing_profile_avg)} | {profile_speedup:.2f}x |")
        report.append("")
        
        # Detailed profiling output for Traditional
        report.append("#### Traditional Algorithm Profiling")
        report.append("```")
        trad_output = io.StringIO()
        trad_stats = pstats.Stats(profile_results['traditional_profiler'], stream=trad_output).sort_stats('cumtime')
        trad_stats.print_stats(10)
        report.append(trad_output.getvalue())
        report.append("```")
        
        # Detailed profiling output for Gasing
        report.append("#### Gasing Algorithm Profiling")
        report.append("```")
        gasing_output = io.StringIO()
        gasing_stats = pstats.Stats(profile_results['gasing_profiler'], stream=gasing_output).sort_stats('cumtime')
        gasing_stats.print_stats(10)
        report.append(gasing_output.getvalue())
        report.append("```")
        
        # Detailed results table for individual cases
        report.append("## Detailed Per-Case Benchmark Results")
        report.append("")
        report.append("| No. | A | B | Traditional (ms) | Gasing (ms) | Status |")
        report.append("|-----|---------|---------|-----------------|------------|--------|")
        
        for result in case_results:
            a_truncated = result['a'][:8] + "..." if len(result['a']) > 8 else result['a'].ljust(8)
            b_truncated = result['b'][:8] + "..." if len(result['b']) > 8 else result['b'].ljust(8)
            
            # Format times in milliseconds for display
            trad_time_ms = result['traditional_time'] * 1000
            gasing_time_ms = result['gasing_time'] * 1000
            
            # Status check
            if result['traditional_correct'] and result['gasing_correct']:
                status = "VALID"
            elif result['traditional_correct']:
                status = "TRAD ✓"
            elif result['gasing_correct']:
                status = "GASING ✓"
            else:
                status = "INVALID"
                
            report.append(f"| {result['index']:3d} | {a_truncated} | {b_truncated} | {trad_time_ms:15.6f} | {gasing_time_ms:10.6f} | {status:6s} |")
        
        return "\n".join(report)
    
    def run_comprehensive_benchmark(self):
        """Run a full benchmark suite and generate a report"""
        print("SUBTRACTION ALGORITHM COMPARISON BENCHMARK")
        print("=" * 60)
        
        # Load test cases
        samples, total_cases = self.load_samples(NUM_SAMPLES)
        
        # Run case-by-case benchmarks
        case_results, case_summary = self.run_case_benchmarks(samples)
        
        # Run profiling benchmarks
        profile_results = self.run_profiling_benchmark()
        
        # Generate report
        print("\nGenerating comprehensive benchmark report...")
        report = self.generate_report(case_results, case_summary, profile_results, total_cases)
        
        # Save report to file
        report_file = "src/gasing/subtraction/algorithm_comparison_report.md"
        with open(report_file, 'w') as f:
            f.write(report)
        
        print(f"\nBenchmark complete!")
        print(f"Report saved to: {report_file}")
        
        # Print a quick summary
        print("\nQUICK SUMMARY:")
        print(f"Traditional total time: {self.format_time(case_summary['traditional_total_time'])}")
        print(f"Gasing total time: {self.format_time(case_summary['gasing_total_time'])}")
        
        trad_avg = case_summary['traditional_total_time'] / case_summary['total_cases']
        gasing_avg = case_summary['gasing_total_time'] / case_summary['total_cases']
        speedup = trad_avg / gasing_avg if gasing_avg > 0 else float('inf')
        
        print(f"Speedup: {speedup:.2f}x")
        
        return report

if __name__ == "__main__":
    # Run the benchmark
    benchmark = SubtractionBenchmark()
    benchmark.run_comprehensive_benchmark()
