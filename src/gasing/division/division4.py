import time

a = 123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
b = 4

# GASING Division
start = time.time()
for _ in range(10000000):
        hasil = a * 25 // 100
end = time.time()
gasing_time = end - start
print("GASING Division 4:", gasing_time, "seconds")
print("GASING Result:", hasil)

# Computer Division
start = time.time()
for _ in range(10000000):
    hasil = a // b
end = time.time()
computer_time = end - start
print("General Division 4:", computer_time, "seconds")
print("Computer Result:", hasil)

print("\nGASING is", computer_time/gasing_time, "times faster")