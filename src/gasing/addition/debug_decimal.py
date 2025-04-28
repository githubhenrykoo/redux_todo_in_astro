#!/usr/bin/env python3
"""
Debug script to identify Decimal formatting issues
"""

import sys
import decimal
from decimal import Decimal

# Set precision high enough for our large numbers
decimal.getcontext().prec = 100

def load_test_case(case_num=1):
    """Load a single test case from the dataset"""
    import csv
    with open('large_addition_dataset.csv', 'r') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i+1 == case_num:
                return {
                    'name': row['name'],
                    'a': row['a'],
                    'b': row['b'],
                    'expected': row['expected']
                }
    return None

def compare_formats(a_str, b_str, expected):
    """Compare outputs from different addition methods"""
    # Decimal addition
    a_dec = Decimal(a_str)
    b_dec = Decimal(b_str)
    dec_result = a_dec + b_dec
    
    # Different formatting options for Decimal
    decimal_formats = {
        'str(result)': str(dec_result),
        'format(result, "f")': format(dec_result, 'f'),
        'f"{result:f}"': f"{dec_result:f}",
        'f"{result:f}".split(".")[0]': f"{dec_result:f}".split('.')[0],
        'format(result, ".0f")': format(dec_result, '.0f'),
    }
    
    # Int addition (for reference)
    a_int = int(a_str)
    b_int = int(b_str)
    int_result = a_int + b_int
    int_str = str(int_result)
    
    # Print comparison
    print(f"EXPECTED FORMAT: {expected}")
    print(f"INT RESULT:      {int_str}")
    print(f"MATCH EXPECTED?  {'Yes' if int_str == expected else 'No'}")
    print("\nDECIMAL FORMATS:")
    
    for name, value in decimal_formats.items():
        match = "✓" if value == expected else "✗"
        print(f"{name.ljust(30)}: {value[:30]}{'...' if len(value) > 30 else ''} {match}")
        # Detailed analysis if no match
        if value != expected and len(value) == len(expected):
            # Find first mismatch
            for i, (a, b) in enumerate(zip(value, expected)):
                if a != b:
                    print(f"  First mismatch at position {i}: '{a}' vs '{b}'")
                    break

if __name__ == "__main__":
    case_num = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    test_case = load_test_case(case_num)
    
    if test_case:
        print(f"Testing case {case_num}: {test_case['name']}")
        print(f"A: {test_case['a'][:30]}{'...' if len(test_case['a']) > 30 else ''}")
        print(f"B: {test_case['b'][:30]}{'...' if len(test_case['b']) > 30 else ''}")
        print(f"Expected Sum: {test_case['expected'][:30]}{'...' if len(test_case['expected']) > 30 else ''}")
        print("\n=== FORMAT COMPARISON ===")
        compare_formats(test_case['a'], test_case['b'], test_case['expected'])
    else:
        print(f"Test case {case_num} not found")
