import time
import cProfile
import pstats
from io import StringIO

def gasing_division(a):
    # GASING Division
    iterations = 100000
    
    # Run GASING Division with timing
    start_time = time.time()
    for _ in range(iterations):
        hasil_gasing = a
        sisa = 0
    end_time = time.time()
    gasing_time = end_time - start_time
    
    # Print results and timing information
    print(f"GASING Division 1 Result: {hasil_gasing}")
    print(f"\nTiming for {iterations} iterations:")
    print(f"GASING Division 1: {gasing_time:.6f} seconds")
    
    return hasil_gasing, sisa, gasing_time

def computer_division(a, b):
    # Computer Division
    iterations = 100000
    
    # Run Computer Division with timing
    start_time = time.time()
    for _ in range(iterations):
        hasil_computer = a // b
        sisa = a % b
    end_time = time.time()
    computer_time = end_time - start_time
    
    # Print results and timing information
    print(f"General Division 1 Result: {hasil_computer}")
    print(f"General Division 1: {computer_time:.6f} seconds")
    
    return hasil_computer, sisa, computer_time

# Run with cProfile
profiler = cProfile.Profile()
profiler.enable()

# Execute the division functions
a = 500
b = 1
hasil_gasing, sisa_gasing, gasing_time = gasing_division(a)
hasil_computer, sisa_computer, computer_time = computer_division(a, b)

# Compare performance
print(f"GASING is {computer_time/gasing_time:.2f} times faster")

profiler.disable()

# Print profile stats to console
s = StringIO()
ps = pstats.Stats(profiler, stream=s).sort_stats('cumtime')
ps.print_stats()
print(s.getvalue())

output_file = "src/gasing/alessandro_rumampuk/division/profile_output_division_1.prof"
profiler.dump_stats(output_file)
print(f"\nProfile data saved to {output_file}")