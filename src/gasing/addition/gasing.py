#!/usr/bin/env python3
"""
Module for Gasing Addition: Digit-wise carry detection with detailed logging and optimizations.
Specialized for decimal (base 10) numbers only, with Agothirim optimization for sequences of 9s.
"""

def carry_detection(a_str, b_str):
    """
    Detects carries for each digit position following the Gasing logic with the
    Agothirim optimization for consecutive 9s.
    
    When we encounter a sequence like "79999" and detect a future carry,
    we immediately transform the '7' to '8' and all 9s to 0s, skipping
    ahead in the processing.
    
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
    
    # For tracking performance
    stats = {
        "total_positions": max_len,
        "positions_processed": 0,
        "skipped_positions": 0,
        "carry_operations": 0
    }
    
    # Calculate all position sums up front
    position_sums = [a_padded[i] + b_padded[i] for i in range(max_len)]
    
    # Initialize result for tracking consecutive 9s
    result_digits = [0] * max_len
    
    # Create display strings for debug output
    a_display = ''.join(str(d) for d in a_padded)
    b_display = ''.join(str(d) for d in b_padded)
    
    print(f"Padded A: {a_display}, B: {b_display}\n")
    print(f"Processing left-to-right using Agothirim optimization...\n")
    
    # Process from left to right
    i = 0
    while i < max_len:
        stats["positions_processed"] += 1
        s = position_sums[i]
        print(f"Position {i+1}: A={a_padded[i]}, B={b_padded[i]}, sum={s}")
        
        # Carry detection logic
        if s < 9:
            print(f"  sum < 9: no carry")
            result_digits[i] = s
            i += 1
        elif s > 9:
            print(f"  sum > 9: immediate carry")
            carry[i] = 1
            result_digits[i] = s % 10
            stats["carry_operations"] += 1
            
            # Check for consecutive 9s behind us
            if i > 0:
                j = i - 1
                consecutive_nines = []
                
                # Look for consecutive 9s before current position
                while j >= 0 and result_digits[j] == 9:
                    consecutive_nines.append(j)
                    j -= 1
                
                if consecutive_nines:
                    print(f"  Found {len(consecutive_nines)} consecutive 9(s) before position {i+1}")
                    
                    # Process consecutive 9s
                    for nine_pos in consecutive_nines:
                        print(f"  Setting position {nine_pos+1} from 9 to 0")
                        result_digits[nine_pos] = 0
                        carry[nine_pos] = 1
                        stats["carry_operations"] += 1
                    
                    # Increment the digit before the 9s
                    if j >= 0:
                        print(f"  Incrementing position {j+1} from {result_digits[j]} to {result_digits[j]+1}")
                        result_digits[j] += 1
            i += 1
        else:  # s == 9
            print(f"  sum == 9: checking ahead for future carries")
            
            # Check ahead for digits that would trigger carries
            j = i + 1
            consecutive_nines = [i]  # Start with current position
            
            # Find consecutive 9-sums
            while j < max_len and position_sums[j] == 9:
                print(f"    Position {j+1} also has sum 9, adding to sequence")
                consecutive_nines.append(j)
                j += 1
            
            if j < max_len and position_sums[j] > 9:
                # We found a future carry that affects this entire sequence
                print(f"    Found sum > 9 at position {j+1} after sequence of {len(consecutive_nines)} consecutive 9(s)")
                print(f"    Applying Agothirim optimization: convert all 9s to 0s")
                
                # Set all 9s to 0 with carries
                for nine_pos in consecutive_nines:
                    result_digits[nine_pos] = 0
                    carry[nine_pos] = 1
                    stats["carry_operations"] += 1
                
                # Skip ahead past all the 9s we just processed
                skipped = len(consecutive_nines) - 1  # -1 because we'd process the current position anyway
                stats["skipped_positions"] += skipped
                i = consecutive_nines[-1] + 1
                
                print(f"    Skipping ahead {skipped} positions to position {i+1}")
            else:
                # No carry, just record the 9
                if j < max_len:
                    next_sum = position_sums[j]
                    print(f"    No future carry found, sum < 9 ({next_sum}) at pos {j+1}: keeping 9 as is")
                else:
                    print(f"    Reached end with all 9s: no carry")
                result_digits[i] = 9
                i += 1
        print()
    
    # Print performance stats
    if stats['skipped_positions'] > 0:
        efficiency = (stats['skipped_positions'] / stats['total_positions']) * 100
        print(f"Optimization efficiency: {efficiency:.2f}% of positions skipped")
        print(f"Positions processed: {stats['positions_processed']} of {stats['total_positions']}")
        print(f"Carry operations: {stats['carry_operations']}\n")
    
    return carry


def main():
    """Run interactive Gasing addition logging."""
    print("Gasing Addition with carry detection and Agothirim optimization")
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
        a_padded = a_str.rjust(len(str(sum_dec)))
        b_padded = b_str.rjust(len(str(sum_dec)))
        
        print(f"{a_padded}")
        print(f"{'+' + b_padded[1:]}" if len(b_padded) > 0 else "")
        print("-" * len(str(sum_dec)))
        
        # Display carries above the calculation
        carries_str = ""
        for c in carry:
            carries_str += str(c) if c == 1 else " "
        # Adjust for possible carry in leftmost position
        if len(str(sum_dec)) > len(carries_str):
            carries_str = " " + carries_str
        print(f"{carries_str}")
        print(f"{sum_dec}")
    except ValueError:
        print("Could not compute sum - input must contain only digits")


if __name__ == "__main__":
    main()
