import cProfile
import pstats
import time
from io import StringIO

def traditional_long_division(dividend, divisor, verbose=True):
    """
    Perform traditional long division (school method) with step-by-step output.
    Returns (quotient, remainder) and optionally prints the process.
    """
    dividend_str = str(dividend)
    quotient_digits = []
    remainder = 0
    steps = []

    for idx, digit_char in enumerate(dividend_str):
        digit = int(digit_char)
        current = remainder * 10 + digit
        q_digit = current // divisor
        sub = q_digit * divisor
        remainder = current - sub
        quotient_digits.append(str(q_digit))
        steps.append({
            'step': idx+1,
            'current': current,
            'q_digit': q_digit,
            'sub': sub,
            'remainder': remainder
        })

    quotient = int(''.join(quotient_digits).lstrip('0') or '0')
    if verbose:
        print(f"Traditional Long Division: {dividend} ÷ {divisor}")
        print(f"Quotient: {quotient}")
        print(f"Remainder: {remainder}")
        print("\nStep-by-step process:")
        for s in steps:
            print(f"Step {s['step']}: bring down → {s['current']}, "
                  f"{divisor} × {s['q_digit']} = {s['sub']}, remainder = {s['remainder']}")
    return quotient, remainder

def benchmark_division(iterations=1000000):
    """Run benchmark on the traditional_long_division function"""
    test_cases = [
        (478698745, 5)
    ]
    
    print("\nBENCHMARKING TRADITIONAL LONG DIVISION ALGORITHM")
    print("=" * 60)
    print(f"Running {iterations:,} iterations per test case")
    
    for dividend, divisor in test_cases:
        print(f"\nTest case: {dividend} ÷ {divisor}")
        
        # Time the operation
        start_time = time.time()
        
        for _ in range(iterations):
            traditional_long_division(dividend, divisor, verbose=False)
            
        elapsed = time.time() - start_time
        avg_time = elapsed / iterations
        
        print(f"Total time: {elapsed:.6f} seconds")
        print(f"Average time per iteration: {avg_time:.10f} seconds")
        
        # Run once with verbose output to show the result
        quotient, remainder = traditional_long_division(dividend, divisor, verbose=False)
        print(f"Result: {quotient} remainder {remainder}")
    
    print("\nBenchmark complete!")

if __name__ == "__main__":
    # First run a single example with detailed output
    print("EXAMPLE RUN WITH DETAILED OUTPUT:")
    dividend = 478698745
    divisor = 5
    traditional_long_division(dividend, divisor, verbose=True)
    
    # Run with cProfile
    print("\nRUNNING PERFORMANCE PROFILING")
    profiler = cProfile.Profile()
    profiler.enable()
    benchmark_division(1000000)  # Run 1,000,000 iterations
    profiler.disable()
    
    # Print profile stats
    s = StringIO()
    ps = pstats.Stats(profiler, stream=s).sort_stats('cumtime')
    ps.print_stats(20)  # Show top 20 functions
    print(s.getvalue())