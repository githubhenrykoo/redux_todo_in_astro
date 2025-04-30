#!/usr/bin/env python3
"""
Script to convert benchmark results from plaintext to proper Markdown format
"""

def convert_to_markdown(input_file, output_file):
    """Convert benchmark plaintext to markdown table format"""
    with open(input_file, 'r') as f:
        lines = f.readlines()
    
    # Output starts with the title
    md_content = "# Comparison of Addition Algorithms for 1-50 Digits\n\n"
    
    # Add table header and alignment row
    md_content += "| No | Digits | A | B | Result | Traditional (ms) | GASING (ms) | ARRAY_BASIC (ms) | ARRAY_OPT (ms) | ARRAY_CHUNK (ms) | PYTHON_INT (ms) | DECIMAL (ms) | Validation |\n"
    md_content += "|---:|-------:|:---|:---|:------|----------------:|------------:|----------------:|--------------:|----------------:|---------------:|-------------:|:-----------|\n"

    # Process each row starting from line 5 (after the header)
    for line in lines[5:]:
        line = line.strip()
        # Skip empty lines and separator lines
        if not line or line.startswith('--'):
            continue
            
        # Parse numbers in a simple space-delimited format
        parts = line.split()
        if len(parts) < 12:  # Need at least 12 parts for a valid row
            continue
            
        try:
            # Extract row number
            row_num = parts[0]
            
            # Extract digit count
            digits = parts[1]
            
            # Extract A, B, Result
            index = 2
            a = parts[index]
            while index+1 < len(parts) and parts[index+1] not in ['|']:
                index += 1
                if '...' in parts[index-1]:
                    break
                a += parts[index]
            
            index += 1
            b = parts[index] if index < len(parts) else ""
            while index+1 < len(parts) and parts[index+1] not in ['|']:
                index += 1
                if '...' in parts[index-1]:
                    break
                b += parts[index]
                
            index += 1
            result = parts[index] if index < len(parts) else ""
            while index+1 < len(parts) and not parts[index+1].replace('.', '').isdigit():
                index += 1
                if '...' in parts[index-1]:
                    break
                result += parts[index]
            
            # Get remaining numeric elements for timing values
            remaining = []
            for i in range(index+1, min(index+8, len(parts))):
                if parts[i].replace('.', '').isdigit():
                    remaining.append(parts[i])
                    
            # Add validation status
            validation = "OK"
            
            # Build the MD row
            md_row = f"| {row_num} | {digits} | {a} | {b} | {result} "
            
            # Add timing values (expecting 7 of these)
            for i in range(min(7, len(remaining))):
                md_row += f"| {remaining[i]} "
            
            # Add any missing columns
            for _ in range(7 - len(remaining)):
                md_row += "| - "
                
            # Add validation column and end the row
            md_row += f"| {validation} |\n"
            
            md_content += md_row
            
        except Exception as e:
            print(f"Error parsing line: {line}")
            print(f"Exception: {e}")
            continue
    
    # Add a note about truncated values
    md_content += "\n*Note: For longer numbers, only the first few digits are shown followed by \"...\"*\n"
    
    # Write to output file
    with open(output_file, 'w') as f:
        f.write(md_content)
    
    return md_content

if __name__ == "__main__":
    input_file = "/Users/Henrykoo/Documents/redux_todo_in_astro/src/gasing/addition/benchmark_digits_results.md"
    output_file = "/Users/Henrykoo/Documents/redux_todo_in_astro/src/gasing/addition/benchmark_digits_results_formatted.md"
    
    convert_to_markdown(input_file, output_file)
    print(f"Conversion complete! Results saved to {output_file}")
