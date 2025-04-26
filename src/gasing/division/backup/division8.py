import time

a = 123456789
b = 8

# GASING Division
start = time.time()
for _ in range(10000000):
        hasil = a // 4 // 2
end = time.time()
gasing_time = end - start
print("GASING Division 8:", gasing_time, "seconds")
<<<<<<< HEAD
=======
print("GASING Result:", hasil)
>>>>>>> f04baed (add and edit)

# Computer Division
start = time.time()
for _ in range(10000000):
    hasil = a // b
end = time.time()
computer_time = end - start
print("General Division 8:", computer_time, "seconds")
<<<<<<< HEAD
=======
print("Computer Result:", hasil)
>>>>>>> f04baed (add and edit)

print("\nGASING is", computer_time/gasing_time, "times faster")