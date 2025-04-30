#!/usr/bin/env python3
"""
Script to convert benchmark results from plaintext to proper Markdown format
This version uses regular expressions for more accurate parsing
"""
import re

def convert_to_markdown(input_file, output_file):
    """Convert benchmark plaintext to markdown table format"""
    with open(input_file, 'r') as f:
        content = f.read()
    
    # Start with the markdown header
    md_content = "# Comparison of Addition Algorithms for 1-50 Digits\n\n"
    
    # Add table header and alignment row
    md_content += "| No | Digits | A | B | Result | Traditional (ms) | GASING (ms) | ARRAY_BASIC (ms) | ARRAY_OPT (ms) | ARRAY_CHUNK (ms) | PYTHON_INT (ms) | DECIMAL (ms) | Validation |\n"
    md_content += "|---:|-------:|:---|:---|:------|----------------:|------------:|----------------:|--------------:|----------------:|---------------:|-------------:|:-----------|\n"
    
    # Use regex to match each row of data
    # Pattern for a row: number, digit count, A value, B value, result, and 7 timing values, validation
    pattern = r'(\d+)\s+\|\s+(\d+)\s+\|\s+([^\|]+)\|\s+([^\|]+)\|\s+([^\|]+)\|\s+(\d+\.\d+)\s+\|\s+(\d+\.\d+)\s+\|\s+(\d+\.\d+)\s+\|\s+(\d+\.\d+)\s+\|\s+(\d+\.\d+)\s+\|\s+(\d+\.\d+)\s+\|\s+(\d+\.\d+)\s+\|\s+([^\n]+)'
    
    # Alternative simpler pattern if the above doesn't work well
    alt_pattern = r'(\d+)\s+\|\s+(\d+)\s+\|\s+([^\|]+)\|\s+([^\|]+)\|\s+([^\|]+)\|\s+([^\n]+)'
    
    # Try with the direct pattern first
    rows = re.findall(pattern, content)
    
    if not rows:
        # Fall back to a simpler pattern and process the timing values separately
        rows = []
        simple_matches = re.findall(alt_pattern, content)
        for match in simple_matches:
            no, digits, a, b, result, rest = match
            timings = re.findall(r'(\d+\.\d+)', rest)
            validation = "OK" if "OK" in rest else ""
            if len(timings) >= 7:
                rows.append((no, digits, a, b, result, *timings[:7], validation))
    
    # Process the lines
    for row in rows:
        no, digits, a, b, result, *rest = row
        
        # Clean up the values
        a = a.strip()
        b = b.strip()
        result = result.strip()
        
        # Format as markdown row
        md_row = f"| {no} | {digits} | {a} | {b} | {result} |"
        
        # Add timing values
        for value in rest[:-1]:  # All but the last value (validation)
            md_row += f" {value} |"
            
        # Add validation
        md_row += f" {rest[-1]} |\n"
        
        md_content += md_row
    
    # If we couldn't parse any rows with regex, use direct line-by-line parsing
    if not rows:
        md_content += parse_line_by_line(input_file)
    
    # Add a note about truncated values
    md_content += "\n*Note: For longer numbers, only the first few digits are shown followed by \"...\"*\n"
    
    # Write to output file
    with open(output_file, 'w') as f:
        f.write(md_content)
    
    return md_content

def parse_line_by_line(input_file):
    """Alternative parser that works line by line for cases where regex fails"""
    md_content = ""
    with open(input_file, 'r') as f:
        for i, line in enumerate(f):
            # Skip header lines (first 5 lines)
            if i < 5 or not line.strip() or line.startswith('-'):
                continue
                
            # Simple splitting on '|' character
            parts = line.split('|')
            
            # If splitting worked correctly, we should have enough parts
            if len(parts) >= 12:
                row_data = [part.strip() for part in parts]
                md_row = "| " + " | ".join(row_data[1:]) + " |\n"
                md_content += md_row
            else:
                # Directly process the line with fixed column widths
                cols = []
                line = line.rstrip()
                
                # Try to extract by position
                if len(line) > 5:  # Ensure the line is long enough
                    cols.append(line[:3].strip())  # No
                    if len(line) > 11:
                        cols.append(line[3:11].strip())  # Digits
                        
                        # Extract the remaining parts
                        rest = line[11:].split()
                        if len(rest) >= 10:
                            cols.extend(rest[:3])  # A, B, Result
                            cols.extend(rest[3:10])  # Timing values
                            cols.append("OK" if "OK" in line else "")  # Validation
                            
                            md_row = "| " + " | ".join(cols) + " |\n"
                            md_content += md_row
    
    return md_content

if __name__ == "__main__":
    input_file = "/Users/Henrykoo/Documents/redux_todo_in_astro/src/gasing/addition/benchmark_digits_results.md"
    output_file = "/Users/Henrykoo/Documents/redux_todo_in_astro/src/gasing/addition/benchmark_md_formatted.md"
    
    convert_to_markdown(input_file, output_file)
    print(f"Conversion complete! Results saved to {output_file}")
