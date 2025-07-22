#!/usr/bin/env python3
"""
Modified version of Professor Surya's Gasing Addition implementation.
This version returns results instead of printing them for benchmarking purposes.
"""

# Import original implementation
from profsgasingaddition import DIGIT_SUMS

def table_based_addition(a_str, b_str, silent=True):
    """
    Implements optimized addition algorithm using table lookups and cluster-based processing.
    Modified to optionally return result instead of printing.
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
        
        # Store sum
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
        
    # Only print intermediate results if not silent
    if not silent:
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
    
    # Only print the result if not silent
    if not silent:
        print("THE RESULT IS : ")
        for x in reversed(rslt):
            print(x, end="")
        print("")
    
    # Return the result as a string
    return ''.join(str(x) for x in reversed(rslt))

def gasing_addition(a_str, b_str):
    """
    High-performance optimized implementation of Gasing addition.
    """
    # Modified to return result instead of printing
    return table_based_addition(a_str, b_str)
