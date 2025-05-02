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

def custom_division(a: int, b: int, verbose=True) -> str:
    a_str = str(a)
    result = ''
    buffer = ''

    table = DIVISION_TABLES[b]
    keys_sorted = sorted(table.keys())

    if verbose:
        print(f"### Membagi {a} dengan {b} menggunakan tabel pembagian ###\n")

    for i, digit in enumerate(a_str):
        buffer += digit
        num = int(buffer)

        # Cari nilai terbesar dari tabel yang masih lebih kecil atau sama dengan buffer
        closest_key = -1
        for key in keys_sorted:
            if key <= num:
                closest_key = key
            else:
                break

        if verbose:
            print(f"Langkah {i+1}:")
            print(f"  Tambahkan digit '{digit}' → Buffer sekarang: {buffer}")

        if closest_key != -1:
            digit_result = table[closest_key]
            selisih = num - closest_key
            if verbose:
                print(f"  {closest_key} adalah nilai tertinggi dalam tabel ≤ {num}")
                print(f"  {closest_key} ÷ {b} = {digit_result}")
                print(f"  Sisa (remainder): {num} - {closest_key} = {selisih}")
            result += str(digit_result)
            buffer = str(selisih)
        else:
            if verbose:
                print(f"  Tidak ada nilai dalam tabel ≤ {num}")
                print(f"  Tambahkan '0' ke hasil.")
            result += '0'
            # Buffer tetap karena belum bisa dibagi

        if verbose:
            print(f"  Hasil sementara: {result}")
            print(f"  Buffer diteruskan: '{buffer}'\n")

    if verbose:
        print("### Pembagian selesai ###")
        print(f"Hasil akhir (dengan nol depan): {result}\n")
    return result

import cProfile
import pstats
import time
from io import StringIO

def benchmark_division(iterations=100000):
    """Run benchmark on the custom_division function"""
    test_cases = [
        (555, 5)
    ]
    
    print("\nBENCHMARKING CUSTOM DIVISION ALGORITHM")
    print("=" * 50)
    print(f"Running {iterations} iterations per test case")
    
    for a, b in test_cases:
        print(f"\nTest case: {a} ÷ {b}")
        
        # Time the operation
        start_time = time.time()
        
        for _ in range(iterations):
            custom_division(a, b, verbose=False)
            
        elapsed = time.time() - start_time
        avg_time = elapsed / iterations
        
        print(f"Total time: {elapsed:.6f} seconds")
        print(f"Average time per iteration: {avg_time:.8f} seconds")
        print(f"Result: {custom_division(a, b, verbose=False)}")
    
    print("\nBenchmark complete!")

# Run a single example with verbose output
a = 478698745
b = 5
print("EXAMPLE RUN WITH DETAILED OUTPUT:")
hasil = custom_division(a, b, verbose=True)
print("Hasil:", hasil)

# Run with cProfile
print("\nRUNNING PERFORMANCE PROFILING")
profiler = cProfile.Profile()
profiler.enable()
benchmark_division(1000000)  # Run 100,000 iterations
profiler.disable()

# Print profile stats
s = StringIO()
ps = pstats.Stats(profiler, stream=s).sort_stats('cumtime')
ps.print_stats(20)  # Show top 20 functions
print(s.getvalue())