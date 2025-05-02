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
        hasil_gasing = a * 2 // 10
    end_time = time.time()
    gasing_time = end_time - start_time
    
    # Print results and timing information
    print(f"GASING Division 5 Result: {hasil_gasing}")
    print(f"\nTiming for {iterations} iterations:")
    print(f"GASING Division 5: {gasing_time:.6f} seconds")
    
    return hasil_gasing, gasing_time

def computer_division(a, b):
    # Computer Division
    iterations = 100000
    
    # Run Computer Division with timing
    start_time = time.time()
    for _ in range(iterations):
        hasil_computer = a // b
    end_time = time.time()
    computer_time = end_time - start_time
    
    # Print results and timing information
    print(f"General Division 5 Result: {hasil_computer}")
    print(f"General Division 5: {computer_time:.6f} seconds")
    
    return hasil_computer, computer_time

# Run with cProfile
profiler = cProfile.Profile()
profiler.enable()

# Execute the division functions
a = 500
b = 5
hasil_gasing, gasing_time = gasing_division(a)
hasil_computer, computer_time = computer_division(a, b)

# Compare performance
if gasing_time < computer_time:
    print(f"GASING is {computer_time/gasing_time:.2f} times faster")
else:
    print(f"Computer is {gasing_time/computer_time:.2f} times faster")

profiler.disable()

# Print profile stats
s = StringIO()
ps = pstats.Stats(profiler, stream=s).sort_stats('cumtime')
ps.print_stats()
print(s.getvalue())

output_file = "src/gasing/alessandro_rumampuk/division/profile_output_division_5.prof"
profiler.dump_stats(output_file)
print(f"\nProfile data saved to {output_file}")