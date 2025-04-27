#!/usr/bin/env python3
"""
Basic Addition Algorithm

This is the standard right-to-left addition algorithm with carry
that most people learn in elementary school.
"""

def basic_addition(a_str, b_str):
    """
    Performs traditional right-to-left addition algorithm with carry.
    
    Args:
        a_str: First number as a string
        b_str: Second number as a string
    
    Returns:
        The result as a string and a list of carries
    """
    # Convert to lists of digits
    a_digits = [int(d) for d in a_str]
    b_digits = [int(d) for d in b_str]
    
    # Pad to same length
    max_len = max(len(a_digits), len(b_digits))
    a_padded = [0] * (max_len - len(a_digits)) + a_digits
    b_padded = [0] * (max_len - len(b_digits)) + b_digits
    
    # Initialize result and carry
    result_digits = []
    carry = 0
    carry_positions = [0] * max_len
    
    # Process digits right to left (reverse the lists)
    a_padded.reverse()
    b_padded.reverse()
    
    # Go through each digit, starting from the rightmost
    for i in range(max_len):
        # Add digits and previous carry
        digit_sum = a_padded[i] + b_padded[i] + carry
        
        # Determine result digit and new carry
        result_digit = digit_sum % 10
        carry = digit_sum // 10
        
        # Record the carry for the next position
        if i < max_len - 1 and carry > 0:
            carry_positions[max_len - i - 2] = 1
        
        # Add digit to result (at the beginning since we're going right to left)
        result_digits.insert(0, result_digit)
    
    # If there's a final carry, add it to the beginning of the result
    if carry > 0:
        result_digits.insert(0, carry)
    
    # Convert result back to string
    result = ''.join(str(d) for d in result_digits)
    
    return result, carry_positions


def print_step_by_step(a_str, b_str):
    """Print step-by-step calculation of addition with carries."""
    print("\nStep-by-step basic addition:")
    
    # Calculate the sum and carries
    result, carries = basic_addition(a_str, b_str)
    
    # Prepare for display
    max_len = max(len(a_str), len(b_str))
    padded_a = a_str.rjust(max_len)
    padded_b = b_str.rjust(max_len)
    
    # Show each step
    carry = 0
    steps = []
    
    # Create padded a and b for display
    display_a = " " * (len(result) - len(padded_a)) + padded_a
    display_b = " " * (len(result) - len(padded_b)) + padded_b
    
    # Process right to left
    a_digits = [int(d) for d in padded_a]
    b_digits = [int(d) for d in padded_b]
    
    # Generate step-by-step calculation
    for i in range(max_len-1, -1, -1):
        digit_sum = a_digits[i] + b_digits[i] + carry
        result_digit = digit_sum % 10
        carry = digit_sum // 10
        
        step = f"Step {max_len-i}: Add digits at position {i+1}: {a_digits[i]} + {b_digits[i]}"
        
        if carry > 0:
            step += f" + carry {carry} = {digit_sum}, write {result_digit}, carry {carry}"
        else:
            step += f" = {digit_sum}, write {digit_sum}"
            
        steps.append(step)
    
    # Print carry line
    carry_line = ""
    for c in carries:
        carry_line += "1" if c == 1 else " "
    
    if any(c == 1 for c in carries):
        print(f" {carry_line}")
    
    # Print the calculation
    print(f" {display_a}")
    print(f"+{display_b}")
    print("-" * (len(result) + 1))
    print(f" {result}")
    
    # Print steps
    print("\nDetailed steps:")
    for step in steps:
        print(step)


def main():
    """Run the basic addition algorithm with visualization."""
    print("Basic Addition Algorithm")
    print("This is the standard addition algorithm most people learn in school.")
    
    a_str = input("Enter first number: ")
    b_str = input("Enter second number: ")
    
    try:
        # Validate input
        a_val = int(a_str)
        b_val = int(b_str)
        
        # Verify that our algorithm produces the correct result
        result, carries = basic_addition(a_str, b_str)
        expected = str(a_val + b_val)
        
        # Print the step-by-step calculation
        print_step_by_step(a_str, b_str)
        
        # Verify the result
        print(f"\nResult: {result}")
        print(f"Expected: {expected}")
        
        if result == expected:
            print("Verification: Correct!")
        else:
            print("Verification: FAILED!")
            
    except ValueError:
        print("Please enter valid numbers.")


if __name__ == "__main__":
    main()
