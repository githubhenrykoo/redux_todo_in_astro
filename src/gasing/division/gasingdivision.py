import time

# Pembagian

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
        # Algorithm
        hasil = a
    end = time.time()
    gasing_time = end - start
    print("GASING Division 1:", gasing_time, "seconds")
    print("GASING Result:", hasil)
    
    # Computer Division
    start = time.time()
    for _ in range(10000000):
        # Algorithm
        hasil = a // b
    end = time.time()
    computer_time = end - start
    print("\nComputer Division 1:", computer_time, "seconds")
    print("Computer Result:", hasil)
    print("\nGASING is", computer_time/gasing_time, "times faster")

# Division by 2
elif b == 2:
    # GASING Division
    start = time.time()
    for _ in range(10000000):
        # Algorithm
        hasil = int(str(a * 5)[:-1])
    end = time.time()
    gasing_time = end - start
    print("GASING Division 2:", gasing_time, "seconds")
    print("GASING Result:", hasil)
    
    # Computer Division
    start = time.time()
    for _ in range(10000000):
        # Algorithm
        hasil = a // b
    end = time.time()
    computer_time = end - start
    print("\nComputer Division 2:", computer_time, "seconds")
    print("Computer Result:", hasil)
    print("\nGASING is", computer_time/gasing_time, "times faster")

# Division by 4
elif b == 4:
    # GASING Division
    start = time.time()
    for _ in range(10000000):
        # Algorithm
        hasil = int(str(a * 25)[:-2])
    end = time.time()
    gasing_time = end - start
    print("GASING Division 4:", gasing_time, "seconds")
    
    # Computer Division
    start = time.time()
    for _ in range(10000000):
        # Algorithm
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
        # Algorithm
        hasil = int(str(a * 2)[:-1])
    end = time.time()
    gasing_time = end - start
    print("GASING Division 5:", gasing_time, "seconds")
    
    # Computer Division
    start = time.time()
    for _ in range(10000000):
        # Algorithm
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
        # Algorithm
        hasil = int(str(a // 4 // 2)[:-4])
    end = time.time()
    gasing_time = end - start
    print("GASING Division 8:", gasing_time, "seconds")
    print("GASING Result:", hasil)
    
    # Computer Division
    start = time.time()
    for _ in range(10000000):
        # Algorithm
        hasil = a // b
    end = time.time()
    computer_time = end - start
    print("\nComputer Division 8:", computer_time, "seconds")
    print("Computer Result:", hasil)
    print("\nGASING is", computer_time/gasing_time, "times faster")

# Division by 10
elif b == 10:
    # GASING Division
    start = time.time()
    for _ in range(10000000):
        # Algorithm
        hasil = int(str(a)[:-1])
    end = time.time()
    gasing_time = end - start
    print("GASING Division 10:", gasing_time, "seconds")
    
    # Computer Division
    start = time.time()
    for _ in range(10000000):
        # Algorithm
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
        # Algorithm
        hasil = int(str(a)[:-2])
    end = time.time()
    gasing_time = end - start
    print("GASING Division 100:", gasing_time, "seconds")
    
    # Computer Division
    start = time.time()
    for _ in range(10000000):
        # Algorithm
        hasil = a // b
    end = time.time()
    computer_time = end - start
    print("Computer Division 100:", computer_time, "seconds")
    print("\nGASING is", computer_time/gasing_time, "times faster")

# For other cases (non-special divisions)
else:
    print(f"\nDivision by {b} is not a special case. Using computer division only.")
    # Computer Division
    start = time.time()
    for _ in range(10000000):
        hasil = a // b
    end = time.time()
    computer_time = end - start
    print(f"Computer Division {b}:", computer_time, "seconds")
    print("Computer Result:", hasil)