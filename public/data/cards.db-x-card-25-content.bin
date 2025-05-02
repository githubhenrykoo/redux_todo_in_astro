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
    High-performance implementation of traditional school addition with minimal operations.
    Performs digit-by-digit right-to-left addition as taught in schools.
    
    Args:
        a_str: First number as a string
        b_str: Second number as a string
        
    Returns:
        The sum as a string
    """
    # Convert to lists of digits
    a_digits = [int(d) for d in a_str]
    b_digits = [int(d) for d in b_str]
    
    # Pad to same length
    max_len = max(len(a_digits), len(b_digits))
    a_padded = [0] * (max_len - len(a_digits)) + a_digits
    b_padded = [0] * (max_len - len(b_digits)) + b_digits
    
    # Initialize result array and carry
    result_digits = [0] * max_len
    carry = 0
    
    # Traditional right-to-left addition with carry
    for i in range(max_len-1, -1, -1):  # Start from rightmost digit
        # Sum the digits and carry
        s = a_padded[i] + b_padded[i] + carry
        # Store this digit of result
        result_digits[i] = s % 10
        # Carry for next digit
        carry = s // 10
    
    # Handle final carry if any
    if carry > 0:
        result_digits = [carry] + result_digits
    
    # Convert back to string
    return ''.join(str(d) for d in result_digits)


def print_school_addition(a_str, b_str):
    """
    Prints the traditional school addition, showing carries, numbers, and sum in aligned format.
    """
    # Convert to lists of digits
    a_digits = [int(d) for d in a_str]
    b_digits = [int(d) for d in b_str]
    max_len = max(len(a_digits), len(b_digits))
    a_padded = [0] * (max_len - len(a_digits)) + a_digits
    b_padded = [0] * (max_len - len(b_digits)) + b_digits
    result_digits = [0] * max_len
    carries = [0] * (max_len + 1)  # One extra for carry out
    step_details = []
    carry = 0
    # Right to left addition
    for i in range(max_len-1, -1, -1):
        s = a_padded[i] + b_padded[i] + carry
        result_digits[i] = s % 10
        carries[i] = carry
        step_details.append({
            'pos': i+1,
            'A': a_padded[i],
            'B': b_padded[i],
            'carry_in': carry,
            'sum': s,
            'digit': s % 10,
            'carry_out': s // 10
        })
        carry = s // 10
    carries[0] = carry  # Final carry out
    # Prepare strings for display
    carry_row = ''.join(str(c) for c in carries).rjust(max_len+1)
    a_row = ''.join(str(d) for d in a_padded).rjust(max_len+1)
    b_row = ''.join(str(d) for d in b_padded).rjust(max_len+1)
    sum_row = (str(carry) if carry else '') + ''.join(str(d) for d in result_digits)
    sum_row = sum_row.rjust(max_len+1)
    sep_row = '-' * (max_len+1)
    # Print carries
    print("Carries:")
    print(carry_row)
    print(f"  {a_row}")
    print(f"+ {b_row}")
    print(sep_row)
    print(f"  {sum_row}")
    print()
    # Print step by step for each column (optional, for learning)
    print("Step-by-step calculation:")
    for step in reversed(step_details):
        print(f"Position {step['pos']}: {step['A']} + {step['B']} + carry_in {step['carry_in']} = {step['sum']} "
              f"→ write {step['digit']}, carry {step['carry_out']}")
    print()


def main():
    """Run interactive decimal addition with classic school-style display."""
    print("Traditional School Addition (with carries)")
    a_str = input("Enter first number: ")
    b_str = input("Enter second number: ")
    print()
    print_school_addition(a_str, b_str)


if __name__ == "__main__":
    main()
