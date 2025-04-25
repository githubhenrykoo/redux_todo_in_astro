import time

a = 123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
b = 1

# GASING Division
start = time.time()
for _ in range(10000000):
        hasil = a 
        sisa = 0
end = time.time()
gasing_time = end - start
print("GASING Division 1:", gasing_time, "seconds")
print("GASING Result:", hasil)
print("GASING Remainder:", sisa)

# Computer Division
start = time.time()
for _ in range(10000000):
    hasil = a // b
    sisa = a % b
end = time.time()
computer_time = end - start
print("General Division 1:", computer_time, "seconds")
print("Computer Result:", hasil)
print("Computer Remainder:", sisa)

print("\nGASING is", computer_time/gasing_time, "times faster")