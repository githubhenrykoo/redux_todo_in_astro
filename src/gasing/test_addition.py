#!/usr/bin/env python3
"""
Test suite for Gasing Addition algorithm.
"""
import unittest
import io
import sys
from contextlib import redirect_stdout
from addition import carry_detection

class TestGasingAddition(unittest.TestCase):
    """Test cases for the Gasing Addition algorithm."""

    def capture_output(self, func, *args, **kwargs):
        """Helper to capture and return stdout from a function call."""
        f = io.StringIO()
        with redirect_stdout(f):
            result = func(*args, **kwargs)
        return result, f.getvalue()

    def test_basic_addition(self):
        """Test basic addition cases."""
        # Case 1: Simple addition with no carries
        carries, _ = self.capture_output(carry_detection, "123", "456")
        self.assertEqual(carries, [0, 0, 0])
        self.assertEqual(sum(carries), 0)

        # Case 2: Simple addition with carries
        carries, _ = self.capture_output(carry_detection, "456", "789")
        self.assertEqual(carries, [1, 1, 1])  
        self.assertEqual(sum(carries), 3)     

    def test_with_nines(self):
        """Test cases involving 9s which need lookahead."""
        # Case 1: 9+9 with no further carry
        carries, _ = self.capture_output(carry_detection, "19", "29")
        self.assertEqual(carries, [0, 1])     
        
        # Case 2: 9+9 with further carry
        carries, _ = self.capture_output(carry_detection, "199", "299")
        self.assertEqual(carries, [0, 1, 1])  
        
        # Case 3: multiple consecutive 9s
        carries, _ = self.capture_output(carry_detection, "1999", "2999")
        self.assertEqual(carries, [0, 1, 1, 1])  
        
        # Case 4: 9+9 at the end
        carries, _ = self.capture_output(carry_detection, "99", "99")
        self.assertEqual(carries, [1, 1])     

    def test_varying_lengths(self):
        """Test numbers of different lengths."""
        # Different length numbers
        carries, _ = self.capture_output(carry_detection, "12345", "678")
        self.assertEqual(len(carries), 5)
        
        # Very long number with short number
        carries, _ = self.capture_output(carry_detection, "9" * 10, "1")
        self.assertEqual(len(carries), 10)
        self.assertEqual(carries[9], 1)  

    def test_complex_cases(self):
        """Test complex cases with multiple lookups."""
        # Case with multiple 9 chains
        carries, _ = self.capture_output(carry_detection, "19919991", "29929992")
        expected = [0, 1, 1, 0, 1, 1, 1, 0]
        self.assertEqual(carries, expected)
        
        # Edge case with all 9s
        carries, _ = self.capture_output(carry_detection, "9999", "9999")
        self.assertEqual(carries, [1, 1, 1, 1])  
        
        # Case with alternating 9s
        carries, _ = self.capture_output(carry_detection, "9191", "9292")
        expected = [1, 0, 1, 0]
        self.assertEqual(carries, expected)

    def test_different_bases(self):
        """Test addition in different number bases."""
        # Binary (base 2)
        # For "1010" + "0101", each position is exactly threshold (1), so no carries
        carries, _ = self.capture_output(carry_detection, "1010", "0101", base=2)
        self.assertEqual(carries, [0, 0, 0, 0])
        
        # Test with carries in binary - when 1+1=2 > threshold of 1
        carries, _ = self.capture_output(carry_detection, "1101", "1011", base=2)
        self.assertEqual(carries, [1, 1, 1, 0])
        
        # Octal (base 8)
        carries, _ = self.capture_output(carry_detection, "765", "723", base=8)
        # Threshold is 7, sum of 5+3=8 and 6+2=8 exceed it
        # Sum of 7+7=14 exceeds threshold
        self.assertEqual(carries, [1, 1, 1])
        
        # Hexadecimal (base 16)
        carries, _ = self.capture_output(carry_detection, "F9", "06", base=16)
        # F(15)+0=15 < threshold(15), 9+6=15 = threshold, no carry
        self.assertEqual(carries, [0, 0])
        
        # Trinary (base 3)
        carries, _ = self.capture_output(carry_detection, "212", "121", base=3)
        # All positions have sums that exceed the threshold of 2
        self.assertEqual(carries, [1, 1, 1])
        
        # Custom base (base 5)
        carries, _ = self.capture_output(carry_detection, "444", "444", base=5)
        # 4+4=8 > threshold of 4 for all positions
        self.assertEqual(carries, [1, 1, 1])

    def test_verification(self):
        """Verify results against actual addition."""
        test_cases = [
            ("123", "456"),      # 579
            ("999", "999"),      # 1998
            ("1999", "2999"),    # 4998
            ("12345", "67890"),  # 80235
            ("9876", "1234")     # 11110
        ]
        
        for a, b in test_cases:
            carries, _ = self.capture_output(carry_detection, a, b)
            expected_sum = int(a) + int(b)
            carry_count = sum(carries)
            self.assertEqual(int(a) + int(b), expected_sum)


def run_tests():
    """Run all test cases."""
    unittest.main(argv=['first-arg-is-ignored'], exit=False)


def run_interactive_tests():
    """Run a set of predefined tests with visual output."""
    test_cases = [
        # Base 10 test cases
        ("123", "456", 10),      # Simple case, no carries
        ("456", "789", 10),      # Simple case, with carries
        ("19", "29", 10),        # Case with 9, carry detection
        ("199", "299", 10),      # Case with 9, carry needed
        
        # Binary test cases
        ("1010", "0101", 2),     # Binary addition, all sums at threshold
        ("1111", "1111", 2),     # All 1s in binary, all sums exceed threshold
        ("1101", "1011", 2),     # Binary with carries where 1+1=2
        
        # Hexadecimal test cases
        ("ABC", "DEF", 16),      # Hex addition
        ("FF", "01", 16),        # Hex with carry
        
        # Other bases
        ("444", "444", 5),       # Base 5 with all thresholds
        ("212", "121", 3),       # Base 3
    ]
    
    print("Running interactive tests for Gasing Addition:\n")
    
    for a, b, base in test_cases:
        a_val = int(a, base) if base <= 10 or all(c.isdigit() or c.upper() in "ABCDEF" for c in a) else "?"
        b_val = int(b, base) if base <= 10 or all(c.isdigit() or c.upper() in "ABCDEF" for c in b) else "?"
        
        if a_val != "?" and b_val != "?":
            result = a_val + b_val
            print(f"Testing: {a} + {b} (base {base}) = {result} (decimal)")
        else:
            print(f"Testing: {a} + {b} (base {base})")
            
        carry = carry_detection(a, b, base)
        print(f"Carries detected: {carry}")
        print(f"Total carries: {sum(carry)}")
        print("-" * 50)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Test the Gasing Addition algorithm")
    parser.add_argument("--interactive", action="store_true", help="Run interactive tests with detailed output")
    parser.add_argument("--unittest", action="store_true", help="Run unittest test cases")
    parser.add_argument("--base", type=int, help="Specify a base to test (2-36)")
    
    args = parser.parse_args()
    
    if args.base:
        print(f"Testing specific base: {args.base}")
        a = input(f"Enter first number (base {args.base}): ")
        b = input(f"Enter second number (base {args.base}): ")
        carry = carry_detection(a, b, args.base)
        print(f"Carries detected: {carry}")
        print(f"Total carries: {sum(carry)}")
    elif args.interactive:
        run_interactive_tests()
    elif args.unittest:
        run_tests()
    else:
        print("=== RUNNING UNIT TESTS ===")
        run_tests()
        print("\n=== RUNNING INTERACTIVE TESTS ===")
        run_interactive_tests()
