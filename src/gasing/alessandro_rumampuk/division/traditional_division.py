def traditional_long_division(dividend, divisor, verbose=True):
    """
    Perform traditional long division (school method) with step-by-step output.
    Returns (quotient, remainder) and optionally prints the process.
    """
    dividend_str = str(dividend)
    quotient_digits = []
    remainder = 0
    steps = []

    for idx, digit_char in enumerate(dividend_str):
        digit = int(digit_char)
        current = remainder * 10 + digit
        q_digit = current // divisor
        sub = q_digit * divisor
        remainder = current - sub
        quotient_digits.append(str(q_digit))
        steps.append({
            'step': idx+1,
            'current': current,
            'q_digit': q_digit,
            'sub': sub,
            'remainder': remainder
        })

    quotient = int(''.join(quotient_digits).lstrip('0') or '0')
    if verbose:
        print(f"Traditional Long Division: {dividend} ÷ {divisor}")
        print(f"Quotient: {quotient}")
        print(f"Remainder: {remainder}")
        print("\nStep-by-step process:")
        for s in steps:
            print(f"Step {s['step']}: bring down → {s['current']}, "
                  f"{divisor} × {s['q_digit']} = {s['sub']}, remainder = {s['remainder']}")
    return quotient, remainder

if __name__ == "__main__":
    # Example usage
    dividend = 9876
    divisor = 23
    traditional_long_division(dividend, divisor, verbose=True)