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
    # Process directly from right to left (least significant digit first)
    len_a = len(a_str)
    len_b = len(b_str)
    
    # Pre-allocate result for maximum possible length (max length + 1 for carry)
    max_result_len = max(len_a, len_b) + 1
    result = [0] * max_result_len
    
    # Collect all sums for cluster identification
    all_sums = []  # All individual sums
    
    # First pass: compute initial sums without processing carries
    # This allows us to identify clusters
    for i in range(1, min(len_a, len_b) + 1):
        a_digit = int(a_str[len_a - i])  # Get digit from right
        b_digit = int(b_str[len_b - i])  # Get digit from right
        
        # Get the sum without considering carries yet
        digit_sum = DIGIT_SUMS[a_digit][b_digit]
        
        # Store position and sum
        all_sums.append(digit_sum)
    
    # Process remaining digits of longer number
    remaining_str = a_str if len_a > len_b else b_str
    remaining_len = max(len_a, len_b) - min(len_a, len_b)
    
    for i in range(1, remaining_len + 1):
        digit = int(remaining_str[remaining_len - i])
        
        # For remaining digits, the sum is just the digit (other number is 0)
        all_sums.append(digit)
   

    #-----------------------------------------------------------------------------------------
    # Identify clusters 
    # A cluster starts at a number >= 10
    # A cluster ends with a number <9 or when we hit the end of the list
    # There are corner cases:
    #   1. 2 consecutive intermediate sums that are greater than 10
    #   2. A cluster = [A b c d E] where A and E are greater than 10, b, c, d are less than 9
    #-----------------------------------------------------------------------------------------
    gclstr = []
    tmp    = []
    i      = 0
    while i < len(all_sums):
        if all_sums[i] >= 10:
            if len(tmp) > 0:                      # Hit a special case
                tmp.append(all_sums[i]%10)        # Push mod 10 into cluster
                gclstr.append(tmp.copy())         # close cluster, push into gclstr
                tmp.clear()                       # clear tmp
                tmp.append("CC")                  # Push CC mark to tmp
            else:
                tmp.append(all_sums[i])           #Start of a cluster
        elif all_sums[i] < 9:
            if len(tmp) > 0:                      #Hit end of cluster
                tmp.append(all_sums[i])           #Push number to cluster
                gclstr.append(tmp.copy())         #Close cluster and push to gclstr
                tmp.clear()                       #Clear tmp for next cluster
            else:
                gclstr.append(all_sums[i])        #Not a cluster
        elif all_sums[i] == 9:
            if len(tmp) > 0:                      #Hit end of cluster
                tmp.append(all_sums[i])           #Push number to cluster
            else:
                gclstr.append(all_sums[i])        #Not a cluster
        i += 1

    if len(tmp) > 0:                              #In the middle of a cluster while
        gclstr.append(tmp.copy())                 # exitting the while loop

    #-----------------------------------------------------------------------------------------
        
    
    #-----------------------------------------------------------------------------------------
    #Print intermediate results here, including the identified clusters
    #-----------------------------------------------------------------------------------------
    print("INTERMEDIATE SUMS ", end="")
    print("[", end="")
    for x in reversed(all_sums):
        print(x, " ", end="")
    print("]")
  
    print("Here are the clusters")
    print("[", end="")
    for x in reversed(gclstr):
        if type(x) == list:
            print("[", end="")
            for y in reversed(x):
                print(y," ", end="")
            print("]", end="")
        else:
            print(x, " ", end="")
    print("]")
    #-----------------------------------------------------------------------------------------

    #----------------------------------
    # Start Processing the clusters
    #----------------------------------
    rslt = []

    for x in gclstr:
        if type(x) == list:                 #If a gclstr element is a list, it's a cluster
            for y in x:                     #Process the cluster
                if y == "CC":               #"CC" string indicates a corner case cluster
                    pass                    #"CC" string must be at the start of the cluster
                elif y >= 10 :              #Must be the start of a cluster
                    rslt.append(y%10)       #Get the modulo according to Gasing algorithm
                elif y == 9:                #A 9 inside a cluster becomes 0
                    rslt.append(0)
                else:                       #Anything less than 9 be at the end of the cluster
                    rslt.append(y+1)        #Increment by 1 according to the Gasing algorithm
        else:
            rslt.append(x)                  #Not a cluster: put the result as is

    if type(gclstr[-1]) == list:            #Post processing
        z = gclstr[-1]                      #If the last element is a cluster AND the last
        if z[-1] == "CC":                   #   element of this cluster is a "CC":
            rslt.append(1)                  #   add a 1 (Final carry digit)
        elif z[-1] >= 9:                    #If the last element is a cluster AND the last
            rslt.append(1)                  #   element of this cluster is >= 9
                                            #   add a 1 (Final carry digit)
                                            


    print("THE RESULT IS : ")
    for x in reversed(rslt):
        print(x, end="")
    
    print("")



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
    #return table_based_addition_optimized(a_str, b_str)
    return table_based_addition(a_str, b_str)


if __name__ == "__main__":
    print("For verbose educational output, use gasing_verbose.py instead")
    print("This is the optimized performance version")
    
    a_str = input("Enter first number : ")
    b_str = input("Enter second number: ")
    
    result = gasing_addition(a_str, b_str)
