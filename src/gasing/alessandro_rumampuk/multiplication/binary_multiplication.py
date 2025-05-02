def perkalian_biner(a, b):
    """
    Melakukan perkalian biner seperti prosedur mesin.
    a, b: bilangan bulat desimal
    """
    # Ubah ke biner (string)
    a_bin = bin(a)[2:]
    b_bin = bin(b)[2:]

    print(f"{a} dalam biner = {a_bin}")
    print(f"{b} dalam biner = {b_bin}")

    hasil = 0
    print("\nLangkah-langkah proses:")
    for i, digit in enumerate(reversed(b_bin)):
        if digit == '1':
            geser = a << i
            print(f"Bit ke-{i} (1): Tambahkan {a} geser {i}x ke kiri ({a} × {2**i} = {geser})")
            hasil += geser
        else:
            print(f"Bit ke-{i} (0): Lewati")

    print(f"\nHasil akhir: {a} × {b} = {hasil}")
    return hasil

if __name__ == "__main__":
    print("PERKALIAN BINER (prosedur mesin)")
    a = 83
    b = 46
    perkalian_biner(a, b)