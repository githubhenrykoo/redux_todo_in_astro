#!/usr/bin/env python3
"""
Script to convert benchmark results from plaintext to proper Markdown format
"""

def convert_to_markdown(input_file, output_file):
    """Convert benchmark plaintext to markdown table format"""
    with open(input_file, 'r') as f:
        lines = f.readlines()
    
    # Extract the title (first line)
    title = lines[0].strip().replace('# ', '')
    
    # Initialize markdown content with the title
    md_content = f"# {title}\n\n"
    
    # Add the table header and alignment row (already in proper format)
    md_content += "| No | Digits | A | B | Result | Traditional (ms) | GASING (ms) | ARRAY_BASIC (ms) | ARRAY_OPT (ms) | ARRAY_CHUNK (ms) | PYTHON_INT (ms) | DECIMAL (ms) | Validation |\n"
    md_content += "|---:|-------:|:---|:---|:------|----------------:|------------:|----------------:|--------------:|----------------:|---------------:|-------------:|:-----------|\n"
    
    # Process each data row
    for line in lines[5:]:
        if line.strip() and not line.startswith('-'):  # Skip separator lines
            parts = line.strip().split('|')
            # If the line doesn't start with a pipe but has row number at beginning
            if '|' not in line[:3] and line.strip():
                # Extract parts by splitting on whitespace for the first few columns
                cells = line.strip().split()
                if len(cells) >= 5:  # Ensure we have enough data
                    row_num = cells[0]
                    digits = cells[1]
                    a = cells[3]
                    b = cells[5]
                    result = cells[7]
                    
                    # Extract the timing values - find all numbers after the initial columns
                    timing_start_idx = line.find(result) + len(result)
                    timing_part = line[timing_start_idx:].strip()
                    timings = [t.strip() for t in timing_part.split() if t.strip()]
                    
                    if len(timings) >= 7:  # Enough timing columns
                        # Format the markdown row
                        md_row = f"| {row_num} | {digits} | {a} | {b} | {result} | {timings[0]} | {timings[1]} | {timings[2]} | {timings[3]} | {timings[4]} | {timings[5]} | {timings[6]} | {timings[7] if len(timings) > 7 else 'OK'} |\n"
                        md_content += md_row
    
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
