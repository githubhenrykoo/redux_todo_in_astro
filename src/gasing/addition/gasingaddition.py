#!/usr/bin/env python3
"""
Module for Gasing Addition: Optimized large number addition algorithm.
Specialized for decimal (base 10) numbers with streamlined carry propagation.
This version focuses on maximum performance using lookup tables and cluster-based processing.
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

def table_based_addition_optimized(a_str, b_str):
    """
    High-performance implementation of table-based addition algorithm.
    Optimized for speed while maintaining cross-environment compatibility.
    
    Args:
        a_str: First number as a string
        b_str: Second number as a string
        
    Returns:
        The sum as a string
    """
    # For small numbers, use built-in method (it's faster)
    if len(a_str) < 20 and len(b_str) < 20:
        return str(int(a_str) + int(b_str))
    
    # Process directly from right to left (least significant digit first)
    len_a = len(a_str)
    len_b = len(b_str)
    max_len = max(len_a, len_b)
    
    # Pre-allocate result - use bytearray for better performance with numeric data
    result = bytearray(max_len + 1)  # +1 for possible carry
    
    # Single-pass processing with direct table lookups
    carry = 0
    for i in range(1, max_len + 1):
        # Get digits from right, defaulting to 0 if beyond the number's length
        a_digit = int(a_str[len_a - i]) if i <= len_a else 0
        b_digit = int(b_str[len_b - i]) if i <= len_b else 0
        
        # Use table lookup and add carry
        total = DIGIT_SUMS[a_digit][b_digit] + carry
        
        # Extract result digit and new carry
        result[max_len + 1 - i] = total % 10
        carry = total // 10
    
    # Set final carry if needed
    if carry > 0:
        result[0] = carry
        start_pos = 0
    else:
        start_pos = 1
    
    # Convert result to string efficiently
    return ''.join(str(d) for d in result[start_pos:])


def table_based_addition(a_str, b_str):
    """
    Implements optimized addition algorithm using table lookups and cluster-based processing.
    This is the original implementation that identifies clusters for educational purposes.
    
    Args:
        a_str: First number as a string
        b_str: Second number as a string
        
    Returns:
        The sum as a string
    """
    # For small numbers, use built-in method (it's faster)
    if len(a_str) < 20 and len(b_str) < 20:
        return str(int(a_str) + int(b_str))
    
    # Process directly from right to left (least significant digit first)
    len_a = len(a_str)
    len_b = len(b_str)
    
    # Pre-allocate result for maximum possible length (max length + 1 for carry)
    max_result_len = max(len_a, len_b) + 1
    result = [0] * max_result_len
    
    # Collect all sums for cluster identification
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
    
    # Identify carry clusters according to positions where sum >= 10
    # Each cluster ends at a position with sum >= 10
    clusters = []
    current_cluster = []
    
    # Process left to right (in our stored order, that's backwards)
    # Start with leftmost digit (highest index)
    for i in range(len(all_sums)-1, -1, -1):
        sum_val = all_sums[i]
        current_cluster.append(i)
        
        # When we find a sum >= 10, or reach the end, complete this cluster
        if sum_val >= 10 or i == 0:
            # Only add cluster if it has at least one position with sum >= 10
            if any(all_sums[idx] >= 10 for idx in current_cluster):
                clusters.append(list(current_cluster))
            # Start a new cluster
            current_cluster = []
    
    # Now do the actual addition with carry processing
    carry = 0
    result_pos = max_result_len - 1
    
    # Process all positions in right-to-left order
    for i in range(len(all_sums)):
        # Add current digit sum and carry
        total = all_sums[i] + carry
        
        # Extract result digit and new carry
        result[result_pos] = total % 10
        carry = total // 10
        
        result_pos -= 1

    # Set final carry if needed
    if carry > 0:
        result[result_pos] = carry
    
    # Convert to string, trimming leading zero if no overflow
    start_pos = 0 if result[0] != 0 else 1
    return ''.join(str(d) for d in result[start_pos:])


def gasing_addition(a_str, b_str):
    """
    High-performance optimized implementation of Gasing addition.
    
    Args:
        a_str: First number as a string
        b_str: Second number as a string
    
    Returns:
        The sum as a string
    """
    # Use the optimized version for better performance
    return table_based_addition_optimized(a_str, b_str)


if __name__ == "__main__":
    print("For verbose educational output, use gasing_verbose.py instead")
    print("This is the optimized performance version")
    
    a_str = input("Enter first number: ")
    b_str = input("Enter second number: ")
    
    result = gasing_addition(a_str, b_str)
    print(f"Sum: {result}")
