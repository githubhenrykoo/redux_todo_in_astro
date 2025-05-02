def tampilkan_pengurangan_bersusun(minuend, subtrahend):
    # Ubah ke string dan isi dengan nol di depan agar panjangnya sama
    a = str(minuend)
    b = str(subtrahend)
    negative = False
    # If b > a, swap and mark negative
    if int(a) < int(b):
        a, b = b, a
        negative = True
    panjang = max(len(a), len(b))
    a = a.zfill(panjang)
    b = b.zfill(panjang)

    hasil = [''] * panjang
    pinjam = [0] * panjang  # untuk menandai posisi peminjaman
    a = list(map(int, a))
    b = list(map(int, b))

    # Lakukan pengurangan dari kanan ke kiri
    for i in reversed(range(panjang)):
        if a[i] < b[i]:
            j = i - 1
            while j >= 0 and a[j] == 0:
                a[j] = 9
                pinjam[j] = 1
                j -= 1
            a[j] -= 1
            pinjam[j] = 1
            a[i] += 10
        hasil[i] = str(a[i] - b[i])

    hasil_str = ''.join(hasil).lstrip('0') or '0'
    if negative:
        hasil_str = '-' + hasil_str

    # Print steps
    print(f"   {''.join(map(str, a)).rjust(panjang)}")
    print(f"-  {''.join(map(str, b)).rjust(panjang)}")
    print("  " + '-' * max(len(a), len(b)))
    print(f"   {hasil_str.rjust(panjang)}")

if __name__ == "__main__":
    # Example usage, can replace with input() for interactive
    tampilkan_pengurangan_bersusun(12345, 54321)
