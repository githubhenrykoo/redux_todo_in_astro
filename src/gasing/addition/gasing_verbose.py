#!/usr/bin/env python3
"""
Module for Gasing Addition with detailed verbose output.
This version focuses on educational clarity with detailed step-by-step logging of the table-based approach.
"""

# Pre-compute lookup table for digit addition results (including potential carry)
# Each entry contains the actual sum (which may be > 9)
DIGIT_SUMS = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],    # 0+0, 0+1, ..., 0+9
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],   # 1+0, 1+1, ..., 1+9
    [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],  # 2+0, 2+1, ..., 2+9
    [3, 4, 5, 6, 7, 8, 9, 10, 11, 12], # 3+0, 3+1, ..., 3+9
    [4, 5, 6, 7, 8, 9, 10, 11, 12, 13], # 4+0, 4+1, ..., 4+9
    [5, 6, 7, 8, 9, 10, 11, 12, 13, 14], # 5+0, 5+1, ..., 5+9
    [6, 7, 8, 9, 10, 11, 12, 13, 14, 15], # 6+0, 6+1, ..., 6+9
    [7, 8, 9, 10, 11, 12, 13, 14, 15, 16], # 7+0, 7+1, ..., 7+9
    [8, 9, 10, 11, 12, 13, 14, 15, 16, 17], # 8+0, 8+1, ..., 8+9
    [9, 10, 11, 12, 13, 14, 15, 16, 17, 18]  # 9+0, 9+1, ..., 9+9
]

def table_based_addition_verbose(a_str, b_str, verbose=True):
    """
    Implements table-based addition algorithm with detailed verbose output.
    
    This approach:
    1. Uses a lookup table to determine the complete sum at each position
    2. Identifies clusters of digits that need to be processed together due to carries
    3. Works directly on string digits right-to-left
    
    Args:
        a_str: First number as a string
        b_str: Second number as a string
        verbose: Whether to print step-by-step details
    
    Returns:
        The sum as a string and list of carries
    """
    if verbose:
        print("\nTABLE-BASED ADDITION ALGORITHM")
        print("==============================")
        print(f"A: {a_str}")
        print(f"B: {b_str}")
    
    # Process directly from right to left (least significant digit first)
    len_a = len(a_str)
    len_b = len(b_str)
    
    # Pre-allocate result for maximum possible length (max length + 1 for carry)
    max_result_len = max(len_a, len_b) + 1
    result = [0] * max_result_len
    carries = [0] * max_result_len
    
    # Start from rightmost digit and work leftward
    carry = 0
    result_pos = max_result_len - 1  # Start at rightmost position of result
    
    # Collect all sums for verbose output
    all_sums = []  # All individual sums
    all_pos = []   # Positions corresponding to sums (right to left, starting at 1)
    
    # First pass: compute initial sums without processing carries
    # This allows us to identify clusters
    for i in range(1, min(len_a, len_b) + 1):
        a_digit = int(a_str[len_a - i])  # Get digit from right
        b_digit = int(b_str[len_b - i])  # Get digit from right
        
        # Get the sum without considering carries yet
        digit_sum = DIGIT_SUMS[a_digit][b_digit]
        
        # Store position and sum
        all_pos.append(i)
        all_sums.append(digit_sum)
    
    # Process remaining digits of longer number
    remaining_str = a_str if len_a > len_b else b_str
    remaining_len = max(len_a, len_b) - min(len_a, len_b)
    
    for i in range(1, remaining_len + 1):
        digit = int(remaining_str[remaining_len - i])
        
        # For remaining digits, the sum is just the digit (other number is 0)
        pos = min(len_a, len_b) + i
        all_pos.append(pos)
        all_sums.append(digit)
    
    # Identify clusters by finding positions where sum >= 10
    clusters = []
    cluster_start = None
    
    # Loop through positions from left to right (reverse of our storage order)
    for i in range(len(all_pos)-1, -1, -1):
        pos = all_pos[i]
        sum_val = all_sums[i]
        
        if sum_val >= 10:
            # Found a carry - start a new cluster if none active
            if cluster_start is None:
                cluster_start = i
        elif cluster_start is not None:
            # End of a cluster - save it
            clusters.append((cluster_start, i))
            cluster_start = None
    
    # Handle last cluster if it goes to the end
    if cluster_start is not None:
        clusters.append((cluster_start, 0))
    
    # Now do the actual addition with carry processing
    carry = 0
    result_pos = max_result_len - 1
    
    for i in range(1, min(len_a, len_b) + 1):
        a_digit = int(a_str[len_a - i])
        b_digit = int(b_str[len_b - i])
        
        # Add previous carry to the digit sum
        total = DIGIT_SUMS[a_digit][b_digit] + carry
        
        # Extract result digit and new carry
        result_digit = total % 10
        carry = total // 10
        
        # Store result
        result[result_pos] = result_digit
        if carry:
            carries[result_pos-1] = carry
        
        result_pos -= 1
    
    # Process remaining digits
    for i in range(1, remaining_len + 1):
        digit = int(remaining_str[remaining_len - i])
        
        # Add carry
        total = digit + carry
        
        # Extract result digit and new carry
        result_digit = total % 10
        carry = total // 10
        
        # Store result
        result[result_pos] = result_digit
        if carry:
            carries[result_pos-1] = carry
        
        result_pos -= 1
    
    # Set final carry if needed
    if carry > 0:
        result[result_pos] = carry
    
    # Convert to string, trimming leading zero if no overflow
    start_pos = 0 if result[0] != 0 else 1
    sum_str = ''.join(str(d) for d in result[start_pos:])
    
    # Display the clusters and sums
    if verbose:
        print("\nINITIAL DIGIT SUMS (right-to-left): ")
        print(all_sums)
        
        print("\nCLUSTERS TO PROCESS TOGETHER:")
        if clusters:
            for i, (end, start) in enumerate(clusters):
                # Extract the positions and sums in this cluster
                cluster_positions = all_pos[start:end+1]
                cluster_sums = all_sums[start:end+1]
                print(f"Cluster {i+1}: positions {cluster_positions}, sums {cluster_sums}")
        else:
            print("No clusters found - all positions can be processed independently")
        
        print(f"\nFINAL RESULT: {sum_str}")
    
    return sum_str, carries[start_pos:]


def main():
    """Run interactive Table-Based Gasing addition with verbose logging."""
    print("Table-Based Gasing Addition")
    print("Verbose Educational Version")
    print("-"*50)
    
    a_str = input("Enter first number: ")
    b_str = input("Enter second number: ")
    
    # Calculate sum using our algorithm with verbose output
    result, carries = table_based_addition_verbose(a_str, b_str, verbose=True)
    
    # Calculate and display results
    try:
        a_dec = int(a_str)
        b_dec = int(b_str)
        sum_dec = a_dec + b_dec
        
        print(f"\nRESULTS:")
        print(f"A: {a_dec}")
        print(f"B: {b_dec}")
        print(f"Sum: {sum_dec}")
        print(f"Calculated Sum: {result}")
        
        # Verify
        if str(sum_dec) == result:
            print("Verification: Correct! ")
        else:
            print("Verification: FAILED! ")
        
        # Display step-by-step calculation with carries
        print("\nSTEP-BY-STEP CALCULATION:")
        a_padded = a_str.rjust(len(str(sum_dec)))
        b_padded = b_str.rjust(len(str(sum_dec)))
        
        print(f"{a_padded}")
        print(f"{'+' + b_padded[1:]}" if len(b_padded) > 0 else "")
        print("-" * len(str(sum_dec)))
        
        # Display carries above the calculation
        carries_str = ""
        for c in carries:
            carries_str += str(c) if c > 0 else " "
        # Adjust for possible carry in leftmost position
        if len(str(sum_dec)) > len(carries_str):
            carries_str = " " + carries_str
        print(f"{carries_str}")
        print(f"{sum_dec}")
    except ValueError:
        print("Could not compute sum - input must contain only digits")


if __name__ == "__main__":
    main()
