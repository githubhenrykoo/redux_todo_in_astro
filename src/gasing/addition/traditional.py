#!/usr/bin/env python3
"""
Module for Traditional Decimal Addition: Standard right-to-left carry detection.
Simplified to work exclusively with decimal (base 10) numbers.
"""

def traditional_carry_detection(a_str, b_str, verbose=True):
    """
    Detects carries for each digit position using the traditional 
    right-to-left decimal addition algorithm.
    
    Args:
        a_str: First number as a string
        b_str: Second number as a string
        verbose: Whether to print step-by-step details
    
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
    
    # Display padded numbers if verbose
    if verbose:
        print(f"Padded A: {''.join(str(d) for d in a_padded)}")
        print(f"Padded B: {''.join(str(d) for d in b_padded)}\n")
    
    # Traditional right-to-left addition with carry
    current_carry = 0
    for i in range(max_len-1, -1, -1):  # Start from rightmost digit
        s = a_padded[i] + b_padded[i] + current_carry
        
        if verbose:
            print(f"Position {i+1}: A={a_padded[i]}, B={b_padded[i]}, carry_in={current_carry}, sum={s}")
        
        # Determine if there's a carry to the next position
        if s >= 10:
            current_carry = 1
            if verbose:
                print(f"  {s} ÷ 10 = {s//10} remainder {s%10}: carry 1 to position {i}")
        else:
            current_carry = 0
            if verbose:
                print(f"  {s} < 10: no carry")
        
        # Record the carry from this position to the next
        if i > 0:  # Not leftmost position
            carry[i-1] = current_carry
        
        if verbose:
            print()
    
    # The leftmost position might generate a carry out of the number
    if current_carry == 1 and verbose:
        print(f"Carry out from leftmost position: 1\n")
    
    return carry


def traditional_addition(a_str, b_str):
    """
    Performs traditional decimal addition digit by digit, from right to left.
    Returns the result and carries information.
    """
    # Convert to lists of digits
    a_digits = [int(d) for d in a_str]
    b_digits = [int(d) for d in b_str]
    
    # Pad to same length
    max_len = max(len(a_digits), len(b_digits))
    a_padded = [0] * (max_len - len(a_digits)) + a_digits
    b_padded = [0] * (max_len - len(b_digits)) + b_digits
    
    # Traditional right-to-left addition
    result_digits = [0] * max_len
    carry_flags = [0] * max_len
    
    carry = 0
    for i in range(max_len-1, -1, -1):  # Start from rightmost digit
        s = a_padded[i] + b_padded[i] + carry
        result_digits[i] = s % 10
        carry = s // 10
        
        if carry:
            if i > 0:  # Not leftmost position
                carry_flags[i-1] = 1
    
    # Handle carry from leftmost position
    if carry:
        result_digits = [1] + result_digits
    
    # Format result
    result = ''.join(str(d) for d in result_digits)
    
    return result, carry_flags


def optimized_traditional_addition(a_str, b_str):
    """
    High-performance implementation of traditional addition with minimal operations.
    Optimized for benchmarking without any print statements or carry tracking.
    
    Args:
        a_str: First number as a string
        b_str: Second number as a string
        
    Returns:
        The sum as a string
    """
    # Use direct string-to-int conversion for performance
    a = int(a_str) 
    b = int(b_str)
    result = a + b
    return str(result)


def main():
    """Run interactive decimal addition with logging."""
    print("Traditional Decimal Addition with carry detection and logging")
    a_str = input("Enter first number: ")
    b_str = input("Enter second number: ")
    
    # Perform carries detection using the traditional method
    carry = traditional_carry_detection(a_str, b_str)
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
        
        # Perform actual addition using the traditional method
        sum_str, _ = traditional_addition(a_str, b_str)
        print(f"Sum (calculated): {sum_str}")
        
        # Verify result
        if sum_dec == int(sum_str):
            print("Verification: Correct!")
        else:
            print("Verification: FAILED!")
        
        # Display step-by-step calculation with carries
        print("\nStep-by-step calculation:")
        
        # Show carries on top
        carry_str = "".join(str(c) for c in carry).rjust(max(len(a_str), len(b_str)))
        if carry.count(1) > 0:
            print(f"{' ' * (len(sum_str) - len(carry_str))}{carry_str}")
        
        print(f"{' ' * (len(sum_str) - len(a_str))}{a_str}")
        print(f"{' ' * (len(sum_str) - len(b_str))}{b_str}")
        print("-" * len(sum_str))
        print(f"{sum_str}")
        
    except ValueError:
        print("Could not compute sum - input must contain only digits")


if __name__ == "__main__":
    main()
