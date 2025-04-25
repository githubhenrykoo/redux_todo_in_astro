import time

a = 8
b = 100

# GASING Division
start = time.time()
for _ in range(10000000):
    if a == 8:
        hasil = '0',a
end = time.time()
gasing_time = end - start
print("GASING Division 1:", gasing_time, "seconds")
print("GASING Result:", hasil)

# Computer Division
start = time.time()
for _ in range(10000000):
    hasil = a / b
end = time.time()
computer_time = end - start
print("General Division 1:", computer_time, "seconds")
print("Computer Result:", hasil)