#!/usr/bin/env python3
"""
Gasing Addition: Digit-wise carry detection with step-by-step logging.
"""

def carry_detection(a_str, b_str):
    # Pad to same length
    max_len = max(len(a_str), len(b_str))
    a_str = a_str.zfill(max_len)
    b_str = b_str.zfill(max_len)
    A = list(map(int, a_str))
    B = list(map(int, b_str))
    carry = [0] * max_len

    print(f"Padded A: {a_str}, B: {b_str}\n")
    for i in range(max_len):
        s = A[i] + B[i]
        print(f"Position {i+1}: A={A[i]}, B={B[i]}, sum={s}")
        if s < 9:
            print("  sum < 9: no carry")
        elif s > 9:
            print("  sum > 9: immediate carry")
            carry[i] = 1
        else:  # s == 9
            print("  sum == 9: ambiguous, performing lookahead")
            j = i + 1
            # lookahead through consecutive 9-sums
            while j < max_len and (A[j] + B[j]) == 9:
                print(f"    lookahead at pos {j+1}: sum == 9, continue")
                j += 1
            if j < max_len and (A[j] + B[j]) > 9:
                print(f"    lookahead found sum > 9 at pos {j+1}: carry retroactive to pos {i+1}")
                carry[i] = 1
            else:
                if j < max_len:
                    print(f"    lookahead found sum < 9 ({A[j]+B[j]}) at pos {j+1}: no carry")
                else:
                    print("    reached end with all 9s: no carry")
        print()
    return carry


def main():
    print("Gasing Addition with carry detection and logging")
    a_str = input("Enter first number: ")
    b_str = input("Enter second number: ")
    carry = carry_detection(a_str, b_str)
    print("Carry results per position (1=carry):")
    print(carry)
    print(f"Total carries detected: {sum(carry)}")


if __name__ == "__main__":
    main()
