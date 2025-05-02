def binary_division(dividend_dec, divisor_dec):
    # Langkah 1: Konversi angka desimal ke biner
    dividend_bin = bin(dividend_dec)[2:]  # Hilangkan prefix '0b'
    divisor_bin = bin(divisor_dec)[2:]
    
    print(f"Dividend (Desimal): {dividend_dec} -> Biner: {dividend_bin}")
    print(f"Divisor  (Desimal): {divisor_dec} -> Biner: {divisor_bin}")
    print("\nProses Long Division:\n")

    # Inisialisasi variabel untuk hasil dan sisa
    quotient = ""  # String untuk menyimpan hasil bagi dalam biner
    remainder = 0  # Sisa pembagian dalam desimal
    current_value = 0  # Nilai desimal dari bit-bit yang sedang diproses

    # Langkah 2: Proses pembagian biner (long division)
    for i, bit in enumerate(dividend_bin):
        # Geser kiri dan tambah bit baru
        current_value = (current_value << 1) | int(bit)
        
        # Tampilkan proses
        print(f"Step {i+1}: Nilai saat ini = {current_value}", end=" -> ")
        
        # Bandingkan dengan pembagi
        if current_value >= divisor_dec:
            quotient += "1"
            current_value -= divisor_dec
            print(f"Cukup! {current_value + divisor_dec} ÷ {divisor_dec} = 1, Sisa = {current_value}")
        else:
            quotient += "0"
            print("Tidak cukup, Tulis 0")

    # Konversi hasil biner ke desimal
    quotient_int = int(quotient, 2)
    remainder = current_value  # Sisa akhir adalah nilai terakhir

    # Tampilkan hasil akhir
    print("\nHasil Akhir:")
    print(f"Quotient (Biner)  : {quotient}")
    print(f"Quotient (Desimal): {quotient_int}")
    print(f"Remainder         : {remainder}")

    return quotient_int, remainder

# Jalankan contoh pembagian 9835 ÷ 5
if __name__ == "__main__":
    binary_division(9835, 5)