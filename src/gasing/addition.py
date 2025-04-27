#!/usr/bin/env python3
"""
Module for Gasing Addition: Digit-wise carry detection with detailed logging.
Supports any number base from unary to hexadecimal and beyond.
"""

def carry_detection(a_str, b_str, base=10):
    """
    Detects carries for each digit position following the Gasing logic.
    
    Args:
        a_str: First number as a string
        b_str: Second number as a string
        base: The number base to use (default=10)
            Examples: 2 for binary, 8 for octal, 16 for hexadecimal
    
    Returns:
        A list of 0/1 flags for each position indicating carries
    """
    # Convert hexadecimal or higher base digits if needed
    def to_decimal(digit):
        if digit.isdigit():
            return int(digit)
        # Handle hexadecimal and higher bases (A-Z)
        return ord(digit.upper()) - ord('A') + 10
    
    # Parse input digits based on base
    if base > 10:
        a_digits = [to_decimal(d) for d in a_str]
        b_digits = [to_decimal(d) for d in b_str]
    else:
        a_digits = [int(d) for d in a_str]
        b_digits = [int(d) for d in b_str]
    
    # Determine threshold for carries
    carry_threshold = base - 1
    
    # Pad to same length
    max_len = max(len(a_digits), len(b_digits))
    a_padded = [0] * (max_len - len(a_digits)) + a_digits
    b_padded = [0] * (max_len - len(b_digits)) + b_digits
    carry = [0] * max_len
    
    # Convert digits to display format based on base
    def format_digit(d):
        if d < 10:
            return str(d)
        # For bases > 10, use A-Z notation
        return chr(ord('A') + d - 10)
    
    # Create display strings for debug output
    a_display = ''.join(format_digit(d) for d in a_padded)
    b_display = ''.join(format_digit(d) for d in b_padded)
    
    print(f"Base: {base}")
    print(f"Padded A: {a_display}, B: {b_display}\n")
    
    for i in range(max_len):
        s = a_padded[i] + b_padded[i]
        print(f"Position {i+1}: A={format_digit(a_padded[i])}, B={format_digit(b_padded[i])}, sum={s}")
        
        # Carry detection logic
        if s < carry_threshold:
            print(f"  sum < {carry_threshold}: no carry")
        elif s > carry_threshold:
            print(f"  sum > {carry_threshold}: immediate carry")
            carry[i] = 1
        else:  # s == carry_threshold
            print(f"  sum == {carry_threshold}: ambiguous, performing lookahead")
            j = i + 1
            # lookahead through consecutive threshold-sums
            while j < max_len and (a_padded[j] + b_padded[j]) == carry_threshold:
                print(f"    lookahead at pos {j+1}: sum == {carry_threshold}, continue")
                j += 1
            if j < max_len and (a_padded[j] + b_padded[j]) > carry_threshold:
                print(f"    lookahead found sum > {carry_threshold} at pos {j+1}: carry retroactive to pos {i+1}")
                carry[i] = 1
            else:
                if j < max_len:
                    next_sum = a_padded[j] + b_padded[j]
                    print(f"    lookahead found sum < {carry_threshold} ({next_sum}) at pos {j+1}: no carry")
                else:
                    print(f"    reached end with all {carry_threshold}s: no carry")
        print()
    return carry


def main():
    """Run interactive Gasing addition logging."""
    print("Gasing Addition with carry detection and logging")
    a_str = input("Enter first number: ")
    b_str = input("Enter second number: ")
    base = int(input("Enter number base (2-36, default=10): ") or "10")
    
    carry = carry_detection(a_str, b_str, base)
    print("Carry results per position (1=carry):")
    print(carry)
    print(f"Total carries detected: {sum(carry)}")
    
    # For bases <= 10, we can show the decimal sum for verification
    if base <= 10:
        try:
            a_dec = int(a_str, base)
            b_dec = int(b_str, base)
            print(f"Sum (decimal): {a_dec + b_dec}")
            print(f"Sum (base-{base}): {format(a_dec + b_dec, f'0{len(a_str)}')}")
        except ValueError:
            print("Could not compute sum - input may contain digits invalid for this base")


if __name__ == "__main__":
    main()
