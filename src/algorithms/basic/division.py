import sys

try:
    # Get input values from command line arguments
    a = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    b = int(sys.argv[2]) if len(sys.argv) > 2 else 1  # Default to 1 to avoid division by zero
    
    if b == 0:
        print("Error: Cannot divide by zero")
    else:
        hasil = a / b
        # Format the result to 6 decimal places
        formatted_hasil = "{:.6f}".format(hasil)
        print("Hasil Pembagian:", formatted_hasil)

except ValueError:
    print("Error: Invalid input numbers")
except IndexError:
    print("Error: Missing input arguments")
except Exception as e:
    print("Error:", str(e))