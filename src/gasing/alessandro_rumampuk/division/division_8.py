import time


a = 1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
b = 8


# GASING Division
start = time.time()
for _ in range(10000000):
       hasil = a // 4 // 2
end = time.time()
gasing_time = end - start
print("GASING Division 8:", gasing_time, "seconds")


# Computer Division
start = time.time()
for _ in range(10000000):
   hasil = a // b
end = time.time()
computer_time = end - start
print("General Division 8:", computer_time, "seconds")


print("\nGASING is", computer_time/gasing_time, "times faster")