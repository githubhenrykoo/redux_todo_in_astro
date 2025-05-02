# Subtraction lookup table
SUBTRACTION_TABLE = {
    10: {1: 9, 2: 8, 3: 7, 4: 6, 5: 5, 6: 4, 7: 3, 8: 2, 9: 1, 10: 0},
    9: {1: 8, 2: 7, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1, 9: 0, 10: -1},
    8: {1: 7, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 0, 9: -1, 10: -2},
    7: {1: 6, 2: 5, 3: 4, 4: 3, 5: 2, 6: 1, 7: 0, 8: -1, 9: -2, 10: -3},
    6: {1: 5, 2: 4, 3: 3, 4: 2, 5: 1, 6: 0, 7: -1, 8: -2, 9: -3, 10: -4},
    5: {1: 4, 2: 3, 3: 2, 4: 1, 5: 0, 6: -1, 7: -2, 8: -3, 9: -4, 10: -5},
    4: {1: 3, 2: 2, 3: 1, 4: 0, 5: -1, 6: -2, 7: -3, 8: -4, 9: -5, 10: -6},
    3: {1: 2, 2: 1, 3: 0, 4: -1, 5: -2, 6: -3, 7: -4, 8: -5, 9: -6, 10: -7},
    2: {1: 1, 2: 0, 3: -1, 4: -2, 5: -3, 6: -4, 7: -5, 8: -6, 9: -7, 10: -8},
    1: {1: 0, 2: -1, 3: -2, 4: -3, 5: -4, 6: -5, 7: -6, 8: -7, 9: -8, 10: -9}
}

def flowchart_subtraction(a: int, b: int) -> str:
    a_digits = [int(d) for d in str(a).zfill(5)]
    b_digits = [int(d) for d in str(b).zfill(5)]

    if a < b:
        a_digits, b_digits = b_digits, a_digits 

    # Initial subtraction using lookup table
    A = SUBTRACTION_TABLE[a_digits[0]][b_digits[0]]  # a1 - b1
    B = SUBTRACTION_TABLE[a_digits[1]][b_digits[1]]  # a2 - b2
    C = SUBTRACTION_TABLE[a_digits[2]][b_digits[2]]  # a3 - b3
    D = SUBTRACTION_TABLE[a_digits[3]][b_digits[3]]  # a4 - b4
    E = SUBTRACTION_TABLE[a_digits[4]][b_digits[4]]  # a5 - b5

    if E < 0:
        E = SUBTRACTION_TABLE[10][abs(E)]
        D -= 1
    if D < 0:
        D = SUBTRACTION_TABLE[10][abs(D)]
        C -= 1
    if C < 0:
        C = SUBTRACTION_TABLE[10][abs(C)]
        B -= 1
    if B < 0:
        B = SUBTRACTION_TABLE[10][abs(B)]
        A -= 1

    # Combine results
    result = f"{A}{B}{C}{D}{E}"

    if a < b:
        return f"-{result}"

    return result

if __name__ == "__main__":
    a = int(input("Enter first number (5 digits): "))
    b = int(input("Enter second number (5 digits): "))

    # Perform GASING flowchart subtraction
    gasing_result = flowchart_subtraction(a, b)
    
    print(f"GASING Result: {gasing_result}")