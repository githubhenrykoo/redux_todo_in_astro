import time

start_time = time.time()

# Menentukan nilai a dan b
a = 93451
b = 58234

# Waktu mulai penghitungan

# Melakukan perhitungan sebanyak 1 juta kali
for _ in range(1000000):
    result = a - b

print(f"Result of subtraction: {result}")
# Waktu selesai penghitungan
end_time = time.time()


# Menampilkan waktu yang dibutuhkan
execution_time = end_time - start_time
print(f"Execution Time: {end_time - start_time:.6f} seconds")

# Menampilkan hasil pengurangan
