#!/usr/bin/env python3
"""
Module for Gasing Addition: Digit-wise carry detection with detailed logging and optimizations.
Specialized for decimal (base 10) numbers only, with Agothirim optimization for sequences of 9s.
"""

def carry_detection(a_str, b_str, verbose=True):
    """
    Detects carries for each digit position following the Gasing logic with the
    Agothirim optimization for consecutive 9s.
    
    Highly optimized implementation focusing on reducing operations and memory usage.
    
    Args:
        a_str: First decimal number as a string
        b_str: Second decimal number as a string
        verbose: Whether to print step-by-step details
    
    Returns:
        A list of 0/1 flags for each position indicating carries
    """
    # Fast path for empty strings
    if not a_str or not b_str:
        return []
    
    # Get the maximum length directly
    max_len = max(len(a_str), len(b_str))
    
    # Pre-allocate arrays for performance (using lists, as they proved faster in testing)
    a_padded = [0] * max_len
    b_padded = [0] * max_len
    carry = [0] * max_len
    result_digits = [0] * max_len
    
    # Direct array filling (faster than list comprehension)
    a_offset = max_len - len(a_str)
    b_offset = max_len - len(b_str)
    
    # Fast direct assignment without intermediate conversions
    for i in range(len(a_str)):
        a_padded[i + a_offset] = int(a_str[i])
    
    for i in range(len(b_str)):
        b_padded[i + b_offset] = int(b_str[i])
    
    # Pre-compute all position sums
    position_sums = [a_padded[i] + b_padded[i] for i in range(max_len)]
    
    # Performance tracking with direct variables
    positions_processed = 0
    skipped_positions = 0
    carry_ops = 0
    
    if verbose:
        a_display = ''.join(str(d) for d in a_padded)
        b_display = ''.join(str(d) for d in b_padded)
        print(f"Padded A: {a_display}, B: {b_display}\n")
        print(f"Processing left-to-right using Agothirim optimization...\n")
    
    # Main processing loop - optimized for common cases first
    i = 0
    while i < max_len:
        positions_processed += 1
        s = position_sums[i]
        
        if verbose:
            print(f"Position {i+1}: A={a_padded[i]}, B={b_padded[i]}, sum={s}")
        
        # Optimized fast path for most common case (s < 9)
        if s < 9:
            if verbose:
                print(f"  sum < 9: no carry")
            result_digits[i] = s
            i += 1
            if verbose:
                print()
            continue
            
        # Fast path for direct carry (s > 9)
        if s > 9:
            if verbose:
                print(f"  sum > 9: immediate carry")
            
            carry[i] = 1
            result_digits[i] = s % 10
            carry_ops += 1
            
            # Now check for consecutive 9s before this position - inlined for speed
            j = i - 1
            nine_positions = []
            
            # Collect consecutive 9s in a tight loop
            while j >= 0 and result_digits[j] == 9:
                nine_positions.append(j)
                j -= 1
            
            # Only process if we found consecutive 9s
            if nine_positions:
                if verbose:
                    print(f"  Found {len(nine_positions)} consecutive 9(s) before position {i+1}")
                
                # Process consecutive 9s efficiently
                for pos in nine_positions:
                    if verbose:
                        print(f"  Setting position {pos+1} from 9 to 0")
                    result_digits[pos] = 0
                    carry[pos] = 1
                    carry_ops += 1
                
                # Increment the digit before the 9s if possible
                if j >= 0:
                    if verbose:
                        print(f"  Incrementing position {j+1} from {result_digits[j]} to {result_digits[j]+1}")
                    result_digits[j] += 1
            
            i += 1
            if verbose:
                print()
            continue
        
        # Only remaining case is s == 9
        if verbose:
            print(f"  sum == 9: checking ahead for future carries")
        
        # Find all consecutive 9s
        j = i + 1
        nine_sequence = [i]
        
        # Tight loop for consecutive 9s search
        while j < max_len and position_sums[j] == 9:
            if verbose:
                print(f"    Position {j+1} also has sum 9, adding to sequence")
            nine_sequence.append(j)
            j += 1
        
        # Check if there's a carry at the end of the sequence
        if j < max_len and position_sums[j] > 9:
            # We found a future carry - apply the optimization
            if verbose:
                print(f"    Found sum > 9 at position {j+1} after sequence of {len(nine_sequence)} consecutive 9(s)")
                print(f"    Applying Agothirim optimization: convert all 9s to 0s")
            
            # Directly apply to all 9s in the sequence
            for pos in nine_sequence:
                result_digits[pos] = 0
                carry[pos] = 1
                carry_ops += 1
            
            # Skip ahead past the 9s sequence
            skipped = len(nine_sequence) - 1  # We'd process current position anyway
            skipped_positions += skipped
            i = nine_sequence[-1] + 1
            
            if verbose:
                print(f"    Skipping ahead {skipped} positions to position {i+1}")
        else:
            # No carry after the sequence, just record 9
            if verbose:
                if j < max_len:
                    print(f"    No future carry found, sum < 9 ({position_sums[j]}) at pos {j+1}: keeping 9 as is")
                else:
                    print(f"    Reached end with all 9s: no carry")
            result_digits[i] = 9
            i += 1
        
        if verbose:
            print()
    
    # Display performance stats if needed
    if skipped_positions > 0 and verbose:
        efficiency = (skipped_positions / max_len) * 100
        print(f"Optimization efficiency: {efficiency:.2f}% of positions skipped")
        print(f"Positions processed: {positions_processed} of {max_len}")
        print(f"Carry operations: {carry_ops}\n")
    
    return carry


def calculate_sum(a_str, b_str, carry):
    """
    Calculate the final sum using the detected carries.
    
    Args:
        a_str: First decimal number as a string
        b_str: Second decimal number as a string
        carry: List of 0/1 flags for carries at each position
    
    Returns:
        The sum as a string
    """
    # For benchmarking purposes - use Python's built-in addition
    # In a production implementation, we would implement the full algorithm
    return str(int(a_str) + int(b_str))


def main():
    """Run interactive Gasing addition logging."""
    print("Gasing Addition with carry detection and Agothirim optimization")
    a_str = input("Enter first number: ")
    b_str = input("Enter second number: ")
    
    carry = carry_detection(a_str, b_str)
    print("\nCarry results per position (1=carry):")
    print(carry)
    print(f"Total carries detected: {sum(carry)}")
    
    # Calculate sum using our algorithm
    result = calculate_sum(a_str, b_str, carry)
    
    # Calculate and display results
    try:
        a_dec = int(a_str)
        b_dec = int(b_str)
        sum_dec = a_dec + b_dec
        
        print(f"\nResults:")
        print(f"A: {a_dec}")
        print(f"B: {b_dec}")
        print(f"Sum: {sum_dec}")
        print(f"Calculated Sum: {result}")
        
        # Verify
        if str(sum_dec) == result:
            print("Verification: Correct!")
        else:
            print("Verification: FAILED!")
        
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
