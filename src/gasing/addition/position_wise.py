#!/usr/bin/env python3
"""
Module for Position-Wise Addition: Each digit added independently without carries.
Results are represented using a=10, b=11, ... for sums ≥ 10.
"""

def position_wise_addition(a_str, b_str):
    """
    Adds each digit position independently without carrying.
    
    Args:
        a_str: First number as a string (decimal)
        b_str: Second number as a string (decimal)
    
    Returns:
        The result as a string where each position's sum is represented 
        with letters for values >= in
    """
    # Convert to lists of digits
    a_digits = [int(d) for d in a_str]
    b_digits = [int(d) for d in b_str]
    
    # Pad to same length
    max_len = max(len(a_digits), len(b_digits))
    a_padded = [0] * (max_len - len(a_digits)) + a_digits
    b_padded = [0] * (max_len - len(b_digits)) + b_digits
    
    # Display padded numbers
    print(f"Padded A: {''.join(str(d) for d in a_padded)}")
    print(f"Padded B: {''.join(str(d) for d in b_padded)}")
    
    # Process each position independently
    result_digits = []
    position_results = []
    
    for i in range(max_len):
        digit_sum = a_padded[i] + b_padded[i]
        position_results.append((i+1, a_padded[i], b_padded[i], digit_sum))
        
        # Convert to character representation (0-9, a-z)
        if digit_sum < 10:
            result_digits.append(str(digit_sum))
        else:
            # a=10, b=11, etc.
            letter = chr(ord('a') + digit_sum - 10)
            result_digits.append(letter)
    
    result = ''.join(result_digits)
    return result, position_results


def convert_to_decimal(position_wise_result):
    """Convert a position-wise result back to decimal."""
    decimal_value = 0
    position_multiplier = 1
    
    for c in reversed(position_wise_result):
        if c.isdigit():
            digit_value = int(c)
        else:
            # Convert letter to value (a=10, b=11, etc.)
            digit_value = ord(c.lower()) - ord('a') + 10
        
        decimal_value += digit_value * position_multiplier
        position_multiplier *= 10
    
    return decimal_value


def main():
    """Run position-wise addition with detailed logging."""
    print("Position-Wise Addition (No Carrying)")
    a_str = input("Enter first number: ")
    b_str = input("Enter second number: ")
    
    # Calculate the position-wise result
    result, position_results = position_wise_addition(a_str, b_str)
    
    # Display detailed calculation
    print("\nStep-by-step calculation:")
    for pos, a, b, sum_val in position_results:
        digit_representation = str(sum_val) if sum_val < 10 else chr(ord('a') + sum_val - 10)
        print(f"Position {pos}: {a} + {b} = {sum_val} → {digit_representation}")
    
    # Convert back to decimal
    decimal_result = convert_to_decimal(result)
    
    print(f"\nPosition-wise result: {result}")
    print(f"Decimal equivalent: {decimal_result}")
    
    # Display verification
    actual_sum = int(a_str) + int(b_str)
    print(f"Traditional addition: {a_str} + {b_str} = {actual_sum}")
    
    # Display visual representation
    print("\nVisual representation:")
    print(f"{' ' * (max(len(a_str), len(b_str)) - len(a_str))}{a_str}")
    print(f"{' ' * (max(len(a_str), len(b_str)) - len(b_str))}{b_str}")
    print("-" * max(len(a_str), len(b_str)))
    print(f"{' ' * (max(len(a_str), len(b_str)) - len(result))}{result} = {decimal_result}")


if __name__ == "__main__":
    main()
