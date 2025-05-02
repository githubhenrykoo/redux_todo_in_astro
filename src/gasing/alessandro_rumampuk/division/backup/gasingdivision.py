import time

# Pembagian

def lookup_division_value(dividend_digit, divisor: int) -> int:
    """Lookup division value from the tables."""
    if divisor in DIVISION_TABLES:
        for d, v in DIVISION_TABLES[divisor].items():
            if dividend_digit < d:
                return v-1
    return 9 # Default case if no smaller value found

# Get input values
a = int(input("Fill the dividend: "))
b = int(input("Fill the divisor: "))
print()

# Pembagian Khusus
hasil = 0

# Division by 1
if b == 1:
    # GASING Division
    start = time.time()
    for _ in range(10000000):
        hasil = a
    end = time.time()
    gasing_time = end - start
    print("GASING Division 1:", gasing_time, "seconds")
    
    # Computer Division
    start = time.time()
    for _ in range(10000000):
        hasil = a // b
    end = time.time()
    computer_time = end - start
    print("Computer Division 1:", computer_time, "seconds")
    print("\nGASING is", computer_time/gasing_time, "times faster")

# Division by 2
elif b == 2:
    # GASING Division
    start = time.time()
    for _ in range(10000000):
        hasil = int(str(a * 5)[:-1])
    end = time.time()
    gasing_time = end - start
    print("GASING Division 2:", gasing_time, "seconds")
    
    # Computer Division
    start = time.time()
    for _ in range(10000000):
        hasil = a // b
    end = time.time()
    computer_time = end - start
    print("Computer Division 2:", computer_time, "seconds")
    print("\nGASING is", computer_time/gasing_time, "times faster")

# Division by 4
elif b == 4:
    # GASING Division
    start = time.time()
    for _ in range(10000000):
        hasil = int(str(a * 25)[:-2])
    end = time.time()
    gasing_time = end - start
    print("GASING Division 4:", gasing_time, "seconds")
    
    # Computer Division
    start = time.time()
    for _ in range(10000000):
        hasil = a // b
    end = time.time()
    computer_time = end - start
    print("Computer Division 4:", computer_time, "seconds")
    print("\nGASING is", computer_time/gasing_time, "times faster")

# Division by 5
elif b == 5:
    # GASING Division
    start = time.time()
    for _ in range(10000000):
        hasil = int(str(a * 2)[:-1])
    end = time.time()
    gasing_time = end - start
    print("GASING Division 5:", gasing_time, "seconds")
    
    # Computer Division
    start = time.time()
    for _ in range(10000000):
        hasil = a // b
    end = time.time()
    computer_time = end - start
    print("Computer Division 5:", computer_time, "seconds")
    print("\nGASING is", computer_time/gasing_time, "times faster")

# Division by 8
elif b == 8:
    # GASING Division
    start = time.time()
    for _ in range(10000000):
        hasil = int(str(a // 4 // 2)[:-4])
    end = time.time()
    gasing_time = end - start
    print("GASING Division 8:", gasing_time, "seconds")
    
    # Computer Division
    start = time.time()
    for _ in range(10000000):
        hasil = a // b
    end = time.time()
    computer_time = end - start
    print("Computer Division 8:", computer_time, "seconds")
    print("\nGASING is", computer_time/gasing_time, "times faster")

# Division by 10
elif b == 10:
    # GASING Division
    start = time.time()
    for _ in range(10000000):
        hasil = int(str(a)[:-1])
    end = time.time()
    gasing_time = end - start
    print("GASING Division 10:", gasing_time, "seconds")
    
    # Computer Division
    start = time.time()
    for _ in range(10000000):
        hasil = a // b
    end = time.time()
    computer_time = end - start
    print("Computer Division 10:", computer_time, "seconds")
    print("\nGASING is", computer_time/gasing_time, "times faster")

# Division by 100
elif b == 100:
    # GASING Division
    start = time.time()
    for _ in range(10000000):
        hasil = int(str(a)[:-2])
    end = time.time()
    gasing_time = end - start
    print("GASING Division 100:", gasing_time, "seconds")
    
    # Computer Division
    start = time.time()
    for _ in range(10000000):
        hasil = a // b
    end = time.time()
    computer_time = end - start
    print("Computer Division 100:", computer_time, "seconds")
    print("\nGASING is", computer_time/gasing_time, "times faster")

# Division by 3, 6, 7, and 9
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
    
    # GASING Division
    start = time.time()
    for _ in range(10000000):
        hasil = pembagian_flowchart(a, b)
    end = time.time()
    gasing_time = end - start
    print(f"GASING Division {b}:", gasing_time, "seconds")
    
    # Computer Division
    start = time.time()
    for _ in range(10000000):
        hasil = a // b
    end = time.time()
    computer_time = end - start
    print(f"Computer Division {b}:", computer_time, "seconds")
    print("\nGASING is", computer_time/gasing_time, "times faster")

# For other cases
else:
    # GASING Division (using regular division in this case)
    start = time.time()
    for _ in range(10000000):
        hasil = a // b
    end = time.time()
    gasing_time = end - start
    print(f"GASING Division {b}:", gasing_time, "seconds")
    
    # Computer Division
    start = time.time()
    for _ in range(10000000):
        hasil = a // b
    end = time.time()
    computer_time = end - start
    print(f"Computer Division {b}:", computer_time, "seconds")
    print("\nGASING is", computer_time/gasing_time, "times faster")

# Display final result
print("\nHasil Pembagian:", hasil)