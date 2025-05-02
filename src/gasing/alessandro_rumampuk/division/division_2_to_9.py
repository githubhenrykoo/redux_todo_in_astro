import cProfile
import pstats
import time

DIVISION_TABLES = {
    2: {2: 1, 4: 2, 6: 3, 8: 4, 10: 5, 12: 6, 14: 7, 16: 8, 18: 9},
    3: {3: 1, 6: 2, 9: 3, 12: 4, 15: 5, 18: 6, 21: 7, 24: 8, 27: 9},
    4: {4: 1, 8: 2, 12: 3, 16: 4, 20: 5, 24: 6, 28: 7, 32: 8, 36: 9},
    5: {5: 1, 10: 2, 15: 3, 20: 4, 25: 5, 30: 6, 35: 7, 40: 8, 45: 9},
    6: {6: 1, 12: 2, 18: 3, 24: 4, 30: 5, 36: 6, 42: 7, 48: 8, 54: 9},
    7: {7: 1, 14: 2, 21: 3, 28: 4, 35: 5, 42: 6, 49: 7, 56: 8, 63: 9},
    8: {8: 1, 16: 2, 24: 3, 32: 4, 40: 5, 48: 6, 56: 7, 64: 8, 72: 9},
    9: {9: 1, 18: 2, 27: 3, 36: 4, 45: 5, 54: 6, 63: 7, 72: 8, 81: 9}
}

def digit_division(a: int, b: int) -> int:
    a_str = str(a)
    result = ''
    remainder = 0
    table = DIVISION_TABLES.get(b, {})

    for digit_char in a_str:
        digit = int(digit_char)
        current = remainder * 10 + digit

        # Cari nilai terbesar dalam tabel yang tidak melebihi current
        closest = 0
        value = 0
        for key in table:
            if key <= current and key > closest:
                closest = key
                value = table[key]
        
        result += str(value)
        remainder = current - closest

    return int(result)

def benchmark_division(iterations=10000):
    """Run benchmark on the digit_division function"""
    test_cases = [
        (500, 5),
        (12345, 3),
        (987654321, 7),
        (1000000, 8)
    ]
    
    print("\nBENCHMARKING DIGIT DIVISION ALGORITHM")
    print("=" * 50)
    print(f"Running {iterations} iterations per test case")
    
    for a, b in test_cases:
        print(f"\nTest case: {a} ÷ {b}")
        
        # Time the operation
        start_time = time.time()
        
        for _ in range(iterations):
            digit_division(a, b)
            
        elapsed = time.time() - start_time
        avg_time = elapsed / iterations
        
        print(f"Total time: {elapsed:.6f} seconds")
        print(f"Average time per iteration: {avg_time:.8f} seconds")
        print(f"Result: {digit_division(a, b)}")
    
    print("\nBenchmark complete!")

def main():
    # Example usage
    a = 4
    b = 5
    hasil = digit_division(a, b)
    print("Hasil:", hasil)
    
    # Run benchmark
    benchmark_division()

if __name__ == "__main__":
    # Use cProfile to measure performance
    with cProfile.Profile() as profile:
        main()
    
    # Print profile stats
    stats = pstats.Stats(profile)
    stats.sort_stats('cumtime')
    print("\nPERFORMANCE PROFILE:")
    stats.print_stats(10)  # Show top 10 functions