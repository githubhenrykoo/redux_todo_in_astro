import matplotlib.pyplot as plt
import numpy as np

# Data input dari 1 sampai 20
n = np.arange(1, 21)

# Definisi berbagai fungsi Big O
O_1 = np.ones_like(n)
O_log_n = np.log2(n)
O_n = n
O_n_log_n = n * np.log2(n)
O_n2 = n**2
O_2n = 2**n

# Plot semua fungsi
plt.figure(figsize=(10, 6))
plt.plot(n, O_1, label='O(1)')
plt.plot(n, O_log_n, label='O(log n)')
plt.plot(n, O_n, label='O(n)')
plt.plot(n, O_n_log_n, label='O(n log n)')
plt.plot(n, O_n2, label='O(n²)')
plt.plot(n, O_2n, label='O(2ⁿ)', linestyle='--', color='red')

plt.title('Pertumbuhan Big O terhadap Input n')
plt.xlabel('n (ukuran input)')
plt.ylabel('Jumlah Operasi (dalam skala relatif)')
plt.yscale('log')  # Supaya semua kurva kelihatan
plt.legend()
plt.grid(True)
plt.tight_layout()
plt.show()