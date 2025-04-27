#!/usr/bin/env python3
"""
Optimized Gasing Addition: More efficient left-to-right processing
with special handling for consecutive 9s.
"""

def optimized_carry_detection(a_str, b_str):
    """
    Detects carries using an optimized Gasing logic with efficient handling
    of consecutive 9s.
    
    Args:
        a_str: First decimal number as a string
        b_str: Second decimal number as a string
    
    Returns:
        A list of 0/1 flags for each position indicating carries
        and the calculated sum
    """
    # Convert to lists of digits
    a_digits = [int(d) for d in a_str]
    b_digits = [int(d) for d in b_str]
    
    # Pad to same length
    max_len = max(len(a_digits), len(b_digits))
    a_padded = [0] * (max_len - len(a_digits)) + a_digits
    b_padded = [0] * (max_len - len(b_digits)) + b_digits
    carry = [0] * max_len
    
    # Create the result array for the optimized algorithm
    result_digits = [0] * max_len
    
    # Create display strings for debug output
    a_display = ''.join(str(d) for d in a_padded)
    b_display = ''.join(str(d) for d in b_padded)
    
    print(f"Padded A: {a_display}, B: {b_display}\n")
    print("Processing left to right with optimized 9s handling...\n")
    
    # Compute the initial sum at each position (without carries)
    position_sums = [a_padded[i] + b_padded[i] for i in range(max_len)]
    
    i = 0
    while i < max_len:
        s = position_sums[i]
        print(f"Position {i+1}: A={a_padded[i]}, B={b_padded[i]}, sum={s}")
        
        # Standard carry detection logic
        if s < 9:
            print(f"  sum < 9: no carry")
            result_digits[i] = s
        elif s > 9:
            print(f"  sum > 9: immediate carry")
            carry[i] = 1
            result_digits[i] = s % 10
            
            # If not the leftmost digit, propagate carry to the left
            if i > 0:
                j = i - 1
                
                # Check if we need to look for consecutive 9s
                if result_digits[j] == 9:
                    consecutive_nines = [j]
                    k = j - 1
                    
                    # Find all consecutive 9s to the left
                    while k >= 0 and result_digits[k] == 9:
                        consecutive_nines.append(k)
                        k -= 1
                    
                    print(f"  Found {len(consecutive_nines)} consecutive 9(s) before position {i+1}")
                    
                    # Process consecutive 9s (transforming 9s to 0s)
                    for nine_pos in consecutive_nines:
                        print(f"  Setting position {nine_pos+1} from 9 to 0")
                        result_digits[nine_pos] = 0
                        carry[nine_pos] = 1
                    
                    # Increment the digit before the 9s
                    if k >= 0:
                        print(f"  Incrementing position {k+1} from {result_digits[k]} to {result_digits[k]+1}")
                        result_digits[k] += 1
                        # No carry needed here, we're just incrementing
                else:
                    # No consecutive 9s, just the standard carry
                    pass
        else:  # s == 9
            print(f"  sum == 9: checking for future carries")
            
            # Look ahead for a digit that would cause a carry
            j = i + 1
            nine_positions = [i]  # Start with the current position
            
            # Find consecutive 9-sums
            while j < max_len and position_sums[j] == 9:
                print(f"    Position {j+1} also has sum 9, adding to consecutive list")
                nine_positions.append(j)
                j += 1
            
            # Check if there's a carry after the consecutive 9s
            if j < max_len and position_sums[j] > 9:
                print(f"    Found sum > 9 at position {j+1} after {len(nine_positions)} consecutive 9s")
                
                # All 9s become 0s and generate carries
                for nine_pos in nine_positions:
                    print(f"    Setting position {nine_pos+1} from 9 to 0 with carry")
                    result_digits[nine_pos] = 0
                    carry[nine_pos] = 1
            else:
                # No carry, just record the 9
                print(f"    No future carry found, keeping 9 as is")
                result_digits[i] = 9
        
        i += 1
        print()
    
    # Now calculate the final result with the carries properly applied
    final_result = []
    current_carry = 0
    
    # Process right-to-left to apply carries (simple addition)
    for i in range(max_len-1, -1, -1):
        digit_sum = position_sums[i] + current_carry
        final_result.insert(0, digit_sum % 10)
        current_carry = digit_sum // 10
    
    # If there's a final carry, add it
    if current_carry > 0:
        final_result.insert(0, current_carry)
    
    # Convert to string
    result_str = ''.join(str(d) for d in final_result)
    
    return carry, result_str


def main():
    """Run interactive optimized Gasing addition."""
    print("Optimized Gasing Addition with efficient 9s handling")
    a_str = input("Enter first number: ")
    b_str = input("Enter second number: ")
    
    carry, result = optimized_carry_detection(a_str, b_str)
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
        print(f"Optimized result: {result}")
        print(f"Expected sum: {sum_dec}")
        
        # Verify the result
        if int(result) == sum_dec:
            print("✓ Result is correct!")
        else:
            print("✗ Result does not match expected sum!")
        
        # Display step-by-step calculation with carries
        print("\nStep-by-step calculation:")
        # Adjust for possible different lengths in original numbers vs result
        a_padded = a_str.rjust(len(result))
        b_padded = b_str.rjust(len(result))
        
        print(f"{a_padded}")
        print(f"+{b_padded[1:]}" if len(b_padded) > 0 else "")
        print("-" * len(result))
        
        # Display carries above the calculation
        carries_str = ""
        for c in carry:
            carries_str += str(c) if c == 1 else " "
        # Adjust for possible carry in the leftmost position
        if len(result) > len(carries_str):
            carries_str = " " + carries_str
        print(f"{carries_str}")
        print(f"{result}")
    except ValueError:
        print("Could not compute sum - input must contain only digits")


if __name__ == "__main__":
    main()
