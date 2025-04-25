import time

a = 123456789
b = 100

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
print("General Division 100:", computer_time, "seconds")

print("\nGASING is", computer_time/gasing_time, "times faster")