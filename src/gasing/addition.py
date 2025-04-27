#!/usr/bin/env python3
"""
Module for Gasing Addition: Digit-wise carry detection with detailed logging.
Specialized for decimal (base 10) numbers only.
"""

def carry_detection(a_str, b_str):
    """
    Detects carries for each digit position following the Gasing logic.
    
    Args:
        a_str: First decimal number as a string
        b_str: Second decimal number as a string
    
    Returns:
        A list of 0/1 flags for each position indicating carries
    """
    # Convert to lists of digits
    a_digits = [int(d) for d in a_str]
    b_digits = [int(d) for d in b_str]
    
    # Pad to same length
    max_len = max(len(a_digits), len(b_digits))
    a_padded = [0] * (max_len - len(a_digits)) + a_digits
    b_padded = [0] * (max_len - len(b_digits)) + b_digits
    carry = [0] * max_len
    
    # Create display strings for debug output
    a_display = ''.join(str(d) for d in a_padded)
    b_display = ''.join(str(d) for d in b_padded)
    
    print(f"Padded A: {a_display}, B: {b_display}\n")
    
    for i in range(max_len):
        s = a_padded[i] + b_padded[i]
        print(f"Position {i+1}: A={a_padded[i]}, B={b_padded[i]}, sum={s}")
        
        # Carry detection logic
        if s < 9:
            print(f"  sum < 9: no carry")
        elif s > 9:
            print(f"  sum > 9: immediate carry")
            carry[i] = 1
        else:  # s == 9
            print(f"  sum == 9: ambiguous, performing lookahead")
            j = i + 1
            # lookahead through consecutive 9-sums
            while j < max_len and (a_padded[j] + b_padded[j]) == 9:
                print(f"    lookahead at pos {j+1}: sum == 9, continue")
                j += 1
            if j < max_len and (a_padded[j] + b_padded[j]) > 9:
                print(f"    lookahead found sum > 9 at pos {j+1}: carry retroactive to pos {i+1}")
                carry[i] = 1
            else:
                if j < max_len:
                    next_sum = a_padded[j] + b_padded[j]
                    print(f"    lookahead found sum < 9 ({next_sum}) at pos {j+1}: no carry")
                else:
                    print(f"    reached end with all 9s: no carry")
        print()
    return carry


def main():
    """Run interactive Gasing addition logging."""
    print("Gasing Addition with carry detection and logging")
    a_str = input("Enter first number: ")
    b_str = input("Enter second number: ")
    
    carry = carry_detection(a_str, b_str)
    print("\nCarry results per position (1=carry):")
    print(carry)
    print(f"Total carries detected: {sum(carry)}")
    
    # Calculate and display results
    try:
        a_dec = int(a_str)
        b_dec = int(b_str)
        sum_dec = a_dec + b_dec
        
        print(f"\nResults:")
        print(f"A: {a_dec}")
        print(f"B: {b_dec}")
        print(f"Sum: {sum_dec}")
        
        # Display step-by-step calculation with carries
        print("\nStep-by-step calculation:")
        print(f"{' ' * (max(len(a_str), len(b_str)) - len(a_str))}{a_str}")
        print(f"{' ' * (max(len(a_str), len(b_str)) - len(b_str))}{b_str}")
        print("-" * max(len(a_str), len(b_str)))
        
        # Display carries above the calculation
        carries_str = ""
        for c in carry:
            carries_str += str(c) if c == 1 else " "
        print(f"{' ' * (max(len(a_str), len(b_str)) - len(carries_str))}{carries_str}")
        print(f"{sum_dec}")
    except ValueError:
        print("Could not compute sum - input must contain only digits")


if __name__ == "__main__":
    main()
