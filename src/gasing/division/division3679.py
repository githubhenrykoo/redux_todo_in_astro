import sys
import time

# Pembagian

# Division table 1 digit (2-9) from table Di
# DIVISION_TABLES
DIVISION_TABLES = {
    2: {2: 1, 4: 2, 6: 3, 8: 4},
    3: {3: 1, 6: 2, 9: 3, 12: 4, 15: 5, 18: 6, 21: 7, 24: 8, 27: 9},
    4: {4: 1, 8: 2, 12: 3, 16: 4, 20: 5, 24: 6, 28: 7, 32: 8, 36: 9},
    5: {5: 1, 10: 2, 15: 3, 20: 4, 25: 5, 30: 6, 35: 7, 40: 8, 45: 9},
    6: {6: 1, 12: 2, 18: 3, 24: 4, 30: 5, 36: 6, 42: 7, 48: 8, 54: 9},
    7: {7: 1, 14: 2, 21: 3, 28: 4, 35: 5, 42: 6, 49: 7, 56: 8, 63: 9},
    8: {8: 1, 16: 2, 24: 3, 32: 4, 40: 5, 48: 6, 56: 7, 64: 8, 72: 9},
    9: {9: 1, 18: 2, 27: 3, 36: 4, 45: 5, 54: 6, 63: 7, 72: 8, 81: 9},
}

def lookup_division_value(dividend_digit, divisor: int) -> int:
    """Lookup division value from the tables."""
    if divisor in DIVISION_TABLES:
        for d, v in DIVISION_TABLES[divisor].items():
            if dividend_digit < d:
                return v-1
    return 9 # Default case if no smaller value found

# Get input values from command line arguments
a = 123456789
b = 3  # Changed to test division by 3

# Pembagian Khusus
hasil = 0

# Jika divisor 1, maka hasilnya adalah a.
if b == 1:
    hasil = a

# Jika divisor 2, maka hasilnya adalah x 5, hapus "1 digit terakhir = sisa".
elif b == 2:
    hasil = int(str(a * 5)[:-1])

# Jika divisor 4, maka hasilnya adalah x 25, hapus "2 digit terakhir = sisa".
elif b == 4:
    hasil = int(str(a * 25)[:-2])

# Jika divisor 5, maka hasilnya adalah x 2, hapus "1 digit terakhir = sisa".
elif b == 5:
    hasil = int(str(a * 2)[:-1])

# Jika divisor 8, maka hasilnya adalah a / 4 / 2, hapus "4 digit terakhir = sisa".
elif b == 8:
    hasil = int(str(a // 4 // 2)[:-4])

# Jika divisor 10, maka hasilnya adalah a, hapus "2 digit terakhir = sisa".
elif b == 10:
    hasil = int(str(a)[:-1])

# Jika divisor 100, maka hasilnya adalah a, hapus "2 digit terakhir = sisa".
elif b == 100:
    hasil = int(str(a)[:-2])

# Divisor 1 digit yang belum ditangani 3, 6, 7, dan 9.
elif b in [3, 6, 7, 9]:
    def pembagian_flowchart(dividend, divisor):
        # Buat tabel D_{j} berdasarkan D_{0} = 0 dan D_{1} = b
        D = [0, b]
        for j in range(1, 11):
            D.append(D[j-1] + divisor) # D_{j} = D_{j-1} + b

        hasil = ""
        angka_str = str(dividend)
        N = len(angka_str)
        
        B = int(angka_str[0]) # Mulai dari digit pertama
        K = 1
        R = 0
        B = B - D[0]

        while K < N:
            # Use lookup table for single-digit divisors
            if divisor in DIVISION_TABLES:
                Qk = lookup_division_value(B, divisor)
                R = B - Qk * divisor
                hasil += str(Qk)
            else:
                # Original logic for other cases
                for i in range(1, 11):
                    if B < D[i]:
                        Qk = i-1
                        R = B - D[Qk]
                        hasil += str(Qk)
                        break
            
            K += 1
            B = R * 10 + int(angka_str[K-1])

        return int(hasil) # Mengembalikan hasil pembagian & sisa akhir
    
    # GASING Division with timing
    start = time.time()
    for _ in range(10000000):
        hasil = pembagian_flowchart(a, b)
    end = time.time()
    gasing_time = end - start
    print(f"\nTesting division by {b}:")
    print("-" * 30)
    print(f"GASING Division {b}:", gasing_time, "seconds")
    print("GASING Result:", hasil)
    
    # Computer Division with timing
    start = time.time()
    for _ in range(10000000):
        hasil_computer = a // b
    end = time.time()
    computer_time = end - start
    print(f"Computer Division {b}:", computer_time, "seconds")
    print("Computer Result:", hasil_computer)
    print(f"\nGASING is {computer_time/gasing_time:.2f} times faster")

# Jika tidak ada pembagian khusus, maka gunakan pembagian biasa.
else:
    hasil = a // b

# Menampilkan Hasil
print("\nFinal Result:", hasil)