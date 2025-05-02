def show_binary_subtraction(minuend_bin, subtrahend_bin):
    # Konversi biner ke desimal
    minuend_dec = int(minuend_bin, 2)
    subtrahend_dec = int(subtrahend_bin, 2)

    # Validasi: tidak boleh negatif (tanpa dukungan bilangan negatif biner saat ini)
    if minuend_dec < subtrahend_dec:
        print("Error: Hasil negatif tidak didukung.")
        return

    # Hitung hasil dalam desimal dan biner
    result_dec = minuend_dec - subtrahend_dec
    result_bin = bin(result_dec)[2:]

    # Cetak hasil
    print(f"\n{minuend_bin} (biner) = {minuend_dec} (desimal)")
    print(f"{subtrahend_bin} (biner) = {subtrahend_dec} (desimal)")
    print(f"\nPengurangan desimal: {minuend_dec} - {subtrahend_dec} = {result_dec}")
    print(f"Hasil biner: {result_bin}")

    # Tampilkan pengurangan bersusun biner
    max_len = max(len(minuend_bin), len(subtrahend_bin), len(result_bin))
    m = minuend_bin.zfill(max_len)
    s = subtrahend_bin.zfill(max_len)
    r = result_bin.zfill(max_len)

    print("\nProses pengurangan bersusun:")
    print("  " + "  ".join(m))
    print("- " + "  ".join(s))
    print("=" + "--" * max_len)
    print("  " + "  ".join(r))


# Contoh penggunaan
minuend = input("Masukkan bilangan biner pengurang (minuend): ")
subtrahend = input("Masukkan bilangan biner yang dikurangkan (subtrahend): ")

show_binary_subtraction(minuend, subtrahend)
