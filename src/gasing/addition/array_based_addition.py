#!/usr/bin/env python3
"""
Array-based implementation of large number addition.
This optimized version converts string inputs to integer arrays
for faster processing and avoids repeated string-to-int conversions.

Cross-environment compatible design similar to previous Buffer and TextEncoder
polyfills - using only basic data structures that exist in all environments.
"""

def array_based_addition(a_str, b_str):
    """
    Add two large numbers represented as strings by converting to arrays first.
    This approach avoids repeated string-to-int conversions during processing.
    
    Args:
        a_str: First number as string
        b_str: Second number as string
        
    Returns:
        Sum as string
    """
    # Handle empty or zero inputs
    if not a_str or a_str == '0':
        return b_str if b_str else '0'
    if not b_str or b_str == '0':
        return a_str
    
    # Fast path for equal-length numbers
    if len(a_str) == len(b_str):
        # 1. Convert strings to arrays of integers
        a_digits = [int(d) for d in a_str]
        b_digits = [int(d) for d in b_str]
        
        # 2. Preallocate result array with extra space for potential carry
        result = [0] * (len(a_digits) + 1)
        
        # 3. Add directly in integer array format
        carry = 0
        for i in range(len(a_digits)-1, -1, -1):
            total = a_digits[i] + b_digits[i] + carry
            result[i+1] = total % 10
            carry = total // 10
        
        # 4. Set final carry
        result[0] = carry
        
        # 5. Convert back to string, removing leading zero if not needed
        if result[0] == 0:
            return ''.join(map(str, result[1:]))
        else:
            return ''.join(map(str, result))
    
    # General case for numbers of different lengths
    else:
        # Get lengths
        len_a = len(a_str)
        len_b = len(b_str)
        max_len = max(len_a, len_b)
        
        # Convert to arrays with proper padding
        a_digits = [0] * (max_len - len_a) + [int(d) for d in a_str]
        b_digits = [0] * (max_len - len_b) + [int(d) for d in b_str]
        
        # Preallocate result array
        result = [0] * (max_len + 1)
        
        # Add digits and handle carries
        carry = 0
        for i in range(max_len-1, -1, -1):
            total = a_digits[i] + b_digits[i] + carry
            result[i+1] = total % 10
            carry = total // 10
        
        # Set final carry
        result[0] = carry
        
        # Convert back to string, removing leading zero if not needed
        if result[0] == 0:
            return ''.join(map(str, result[1:]))
        else:
            return ''.join(map(str, result))

def optimized_array_addition(a_str, b_str):
    """
    Even more optimized version of array_based_addition with simplified logic.
    This version is cross-environment compatible like Buffer and TextEncoder polyfills.
    
    Args:
        a_str: First number as string
        b_str: Second number as string
        
    Returns:
        Sum as string
    """
    # Get lengths
    len_a = len(a_str)
    len_b = len(b_str)
    max_len = max(len_a, len_b)
    
    # Preallocate result with extra space for carry
    result = [0] * (max_len + 1)
    
    # Add digits from right to left
    carry = 0
    for i in range(1, max_len + 1):
        # Get digits or 0 if beyond length
        a_digit = int(a_str[len_a - i]) if i <= len_a else 0
        b_digit = int(b_str[len_b - i]) if i <= len_b else 0
        
        # Add and handle carry
        total = a_digit + b_digit + carry
        result[max_len + 1 - i] = total % 10
        carry = total // 10
    
    # Handle final carry
    result[0] = carry
    
    # Convert result to string, removing leading zero if not needed
    if result[0] == 0:
        return ''.join(map(str, result[1:]))
    else:
        return ''.join(map(str, result))

def array_chunk_addition(a_str, b_str, chunk_size=4):
    """
    Enhanced array-based addition that processes digits in chunks for better performance.
    Similar in concept to Buffer processing in large chunks for better performance.
    
    Args:
        a_str: First number as string
        b_str: Second number as string
        chunk_size: Number of digits to process in each chunk
        
    Returns:
        Sum as string
    """
    # Pre-pad for equal length and ensure length is multiple of chunk_size
    max_len = max(len(a_str), len(b_str))
    padded_len = ((max_len + chunk_size - 1) // chunk_size) * chunk_size
    a_padded = a_str.zfill(padded_len)
    b_padded = b_str.zfill(padded_len)
    
    # Process in chunks
    result = []
    carry = 0
    
    # Process from right to left in chunks
    for i in range(padded_len-chunk_size, -1, -chunk_size):
        # Get chunk
        a_chunk = int(a_padded[i:i+chunk_size])
        b_chunk = int(b_padded[i:i+chunk_size])
        
        # Add chunks and handle carry
        chunk_sum = a_chunk + b_chunk + carry
        result.insert(0, str(chunk_sum % (10**chunk_size)).zfill(chunk_size))
        carry = chunk_sum // (10**chunk_size)
    
    # Handle final carry
    if carry:
        result.insert(0, str(carry))
    
    # Remove leading zeros and return
    return ''.join(result).lstrip('0') or '0'
