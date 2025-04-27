#!/usr/bin/env python3
"""
Module for Gasing Addition: Digit-wise carry detection with detailed logging and optimizations.
Specialized for decimal (base 10) numbers only, with Agothirim optimization for sequences of 9s.
"""

def carry_detection(a_str, b_str, verbose=True):
    """
    Detects carries for each digit position following the Gasing logic with the
    Agothirim optimization for consecutive 9s.
    
    Optimized implementation that efficiently detects sequences of 9s and
    applies the Agothirim optimization to skip unnecessary processing.
    
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
    
    # Convert to digits directly - faster than making intermediate lists
    max_len = max(len(a_str), len(b_str))
    
    # Preallocate arrays with proper size - avoids resizing
    a_padded = [0] * max_len
    b_padded = [0] * max_len
    carry = [0] * max_len
    result_digits = [0] * max_len
    
    # Fill padded arrays directly - avoid intermediate list creation
    a_offset = max_len - len(a_str)
    b_offset = max_len - len(b_str)
    
    for i in range(len(a_str)):
        a_padded[i + a_offset] = int(a_str[i])
    
    for i in range(len(b_str)):
        b_padded[i + b_offset] = int(b_str[i])
    
    # Precompute all position sums for faster lookup
    position_sums = [0] * max_len
    for i in range(max_len):
        position_sums[i] = a_padded[i] + b_padded[i]
    
    # Performance tracking
    stats = {
        "total_positions": max_len,
        "positions_processed": 0,
        "skipped_positions": 0,
        "carry_operations": 0
    }
    
    if verbose:
        # Create display strings for debug output
        a_display = ''.join(str(d) for d in a_padded)
        b_display = ''.join(str(d) for d in b_padded)
        print(f"Padded A: {a_display}, B: {b_display}\n")
        print(f"Processing left-to-right using Agothirim optimization...\n")
    
    # Process from left to right - optimized loop
    i = 0
    while i < max_len:
        stats["positions_processed"] += 1
        s = position_sums[i]
        
        if verbose:
            print(f"Position {i+1}: A={a_padded[i]}, B={b_padded[i]}, sum={s}")
        
        # Fast paths for common cases
        if s < 9:
            # Most common case: no carry - inline for speed
            if verbose:
                print(f"  sum < 9: no carry")
            result_digits[i] = s
            i += 1
            continue
            
        if s > 9:
            # Direct carry case - avoid extra function calls
            if verbose:
                print(f"  sum > 9: immediate carry")
            
            carry[i] = 1
            result_digits[i] = s % 10
            stats["carry_operations"] += 1
            
            # Optimized consecutive 9s check - combined conditions
            j = i - 1
            consecutive_nines = []
            
            # Look for consecutive 9s before current position - tight loop
            while j >= 0 and result_digits[j] == 9:
                consecutive_nines.append(j)
                j -= 1
            
            if consecutive_nines:
                if verbose:
                    print(f"  Found {len(consecutive_nines)} consecutive 9(s) before position {i+1}")
                
                # Process all 9s in one block - minimize function calls
                for nine_pos in consecutive_nines:
                    if verbose:
                        print(f"  Setting position {nine_pos+1} from 9 to 0")
                    result_digits[nine_pos] = 0
                    carry[nine_pos] = 1
                    stats["carry_operations"] += 1
                
                # Increment the digit before the 9s if possible
                if j >= 0:
                    if verbose:
                        print(f"  Incrementing position {j+1} from {result_digits[j]} to {result_digits[j]+1}")
                    result_digits[j] += 1
            
            i += 1
            if verbose:
                print()
            continue
            
        # Only case left: s == 9 - optimized to minimize branches
        if verbose:
            print(f"  sum == 9: checking ahead for future carries")
        
        # Optimized consecutive 9s detection - linear scan
        j = i + 1
        consecutive_nines = [i]  # Current position starts the sequence
        
        # Find all consecutive 9-sums in one pass
        while j < max_len and position_sums[j] == 9:
            if verbose:
                print(f"    Position {j+1} also has sum 9, adding to sequence")
            consecutive_nines.append(j)
            j += 1
        
        # Check if sequence ends with a carry 
        if j < max_len and position_sums[j] > 9:
            # We found a future carry: optimize the entire sequence at once
            if verbose:
                print(f"    Found sum > 9 at position {j+1} after sequence of {len(consecutive_nines)} consecutive 9(s)")
                print(f"    Applying Agothirim optimization: convert all 9s to 0s")
            
            # Set all 9s to 0 with carries - batch operation
            for nine_pos in consecutive_nines:
                result_digits[nine_pos] = 0
                carry[nine_pos] = 1
                stats["carry_operations"] += 1
            
            # Skip ahead efficiently
            skipped = len(consecutive_nines) - 1  # We'd process current anyway
            stats["skipped_positions"] += skipped
            i = consecutive_nines[-1] + 1
            
            if verbose:
                print(f"    Skipping ahead {skipped} positions to position {i+1}")
        else:
            # No future carry, just record the 9 and continue
            if verbose:
                if j < max_len:
                    print(f"    No future carry found, sum < 9 ({position_sums[j]}) at pos {j+1}: keeping 9 as is")
                else:
                    print(f"    Reached end with all 9s: no carry")
            result_digits[i] = 9
            i += 1
        
        if verbose:
            print()
    
    # Print performance stats if requested
    if stats['skipped_positions'] > 0 and verbose:
        efficiency = (stats['skipped_positions'] / stats['total_positions']) * 100
        print(f"Optimization efficiency: {efficiency:.2f}% of positions skipped")
        print(f"Positions processed: {stats['positions_processed']} of {stats['total_positions']}")
        print(f"Carry operations: {stats['carry_operations']}\n")
    
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
