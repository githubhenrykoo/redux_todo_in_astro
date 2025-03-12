import os
import google.generativeai as genai
import subprocess
from dotenv import load_dotenv
import argparse
import time  # Add this import for sleep function

def setup():
    # Load environment variables
    load_dotenv()
    
    # Configure Gemini
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not set in .env file")
    
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-2.0-pro-exp-02-05')

def clean_latex_sections(content):
    import re
    
    # Find all section commands
    section_pattern = r'\\section\*?{([^}]*)}'
    
    def replace_section(match):
        section_text = match.group(1)
        # Remove any leading numbers (e.g., "1.", "1.1.", etc.)
        cleaned_text = re.sub(r'^\d+\.[\d.]*\s*', '', section_text)
        
        # Special case for Executive Summary
        if cleaned_text.strip() == "Executive Summary":
            return r'\section*{Executive Summary}'
        # Remove asterisk for all other sections
        return r'\section{' + cleaned_text.strip() + '}'
    
    # Replace all section commands
    return re.sub(section_pattern, replace_section, content)

def md_to_latex(model, md_content):
    # Add LaTeX preamble
    latex_preamble = r"""\documentclass{article}
    \usepackage[utf8]{inputenc}
    \usepackage[T1]{fontenc}
    \usepackage{amsmath}
    \usepackage{amssymb}
    \usepackage{graphicx}
    \usepackage{hyperref}
    \usepackage{array}
    \usepackage{tikz}
    \usepackage{xcolor}
    \usetikzlibrary{shapes,arrows,positioning}

    % Custom styles for all diagrams
    \tikzset{
        block/.style={
            rectangle, draw=darkblue, text width=7em,
            text centered, rounded corners,
            minimum height=2em, fill=lightgray!10,
            font=\small
        },
        process/.style={
            rectangle, draw=forestgreen, text width=6em,
            text centered, rounded corners,
            fill=lightgray!30, minimum height=2em,
            font=\small
        },
        line/.style={
            draw, -latex',
            font=\footnotesize
        },
        cloud/.style={
            draw, ellipse,
            minimum width=2cm, minimum height=1cm,
            fill=lightgray!20
        },
        state/.style={
            rectangle, draw=uiblue, text width=8em,
            text centered, rounded corners,
            fill=uiblue!10, minimum height=2.5em,
            font=\small
        }
    }

    % Color definitions
    \definecolor{lightgray}{RGB}{240,240,240}
    \definecolor{darkblue}{RGB}{0,0,139}
    \definecolor{forestgreen}{RGB}{34,139,34}
    \definecolor{uiblue}{RGB}{66,139,202}

    """

    latex_end = r"\end{document}"

    # Split content into sections (assuming sections start with #)
    sections = md_content.split('\n#')
    if sections[0].strip() == '':
        sections = sections[1:]  # Remove empty first section
    sections = ['#' + s for s in sections]  # Add back the # we removed in split

    # Process each section separately with better error handling
    latex_sections = []
    base_prompt = """Convert this Markdown section to LaTeX. Keep all content. Format:
    - Bold: ** -> \\textbf
    - Italic: * -> \\textit
    - Code: ` -> \\texttt
    - Lists: proper itemize/enumerate
    - Tables: proper tabular
    - Do not use ```latex ``` or any similar code block delimiters.
    - Headings conversion:
      * # (H1) -> \\title{} (and add \\maketitle after)
      * ## (H2) -> If text is "Executive Summary" use \\section*{Executive Summary}, otherwise use \\section{}
      * ### (H3) -> \\subsection{}
    - Correctly format tables, numbering, bullet points, and code blocks.
    - Maintain the full content without reduction.
    - Convert mermaid graphs into TikZ pictures using the specified styles in vertical style ("below of") to make good graph in laTex
    Do not include \\documentclass, \\begin{document}, or \\end{document}. Section:
    """

    for i, section in enumerate(sections):
        max_retries = 3
        for attempt in range(max_retries):
            try:
                if attempt > 0:
                    # Exponential backoff
                    wait_time = (2 ** attempt) * 10
                    print(f"Retrying section {i+1}/{len(sections)} in {wait_time} seconds...")
                    time.sleep(wait_time)
                
                print(f"Processing section {i+1}/{len(sections)}")
                response = model.generate_content(base_prompt + section)
                section_content = response.text.strip()
                
                # Clean up any document environments in the section
                section_content = section_content.replace(r'\begin{document}', '')
                section_content = section_content.replace(r'\end{document}', '')
                
                # Clean up section formatting
                section_content = clean_latex_sections(section_content)
                
                latex_sections.append(section_content)
                
                # Successful processing, wait before next section
                time.sleep(5)
                break
            except Exception as e:
                print(f"Error processing section {i+1}: {str(e)}")
                if attempt == max_retries - 1:
                    raise

    # Combine all parts with single document environment
    full_latex = latex_preamble + "\n\\begin{document}\n" + '\n'.join(latex_sections) + "\n\\end{document}"
    
    return full_latex

def create_pdf(latex_content, output_name):
    # Clean up the LaTeX content
    latex_content = latex_content.strip()  # Remove leading/trailing whitespace
    
    # Remove any ```latex and ``` markers throughout the content
    latex_content = latex_content.replace('```latex', '')
    latex_content = latex_content.replace('```', '')
    latex_content = latex_content.strip()  # Clean up any remaining whitespace

    # Get absolute paths
    current_dir = os.path.dirname(os.path.abspath(__file__))
    tex_path = os.path.join(current_dir, f"{os.path.basename(output_name)}.tex")
    
    # Write cleaned LaTeX content to file
    with open(tex_path, "w", encoding='utf-8') as f:
        f.write(latex_content)
    print(f"LaTeX file saved at: {tex_path}")

    # Run pdflatex with absolute paths
    for _ in range(2):
        result = subprocess.run(
            ['pdflatex', '-interaction=nonstopmode', os.path.basename(tex_path)],
            capture_output=True,
            text=True,
            cwd=current_dir  # Set working directory to where the tex file is
        )
        print("LaTeX Output:", result.stdout)
        if result.returncode != 0:
            print("LaTeX Error:", result.stderr)
            log_file = os.path.join(current_dir, f"{os.path.basename(output_name)}.log")
            if os.path.exists(log_file):
                with open(log_file, 'r') as log:
                    print("LaTeX Log:", log.read())
            raise Exception("PDF generation failed")

    pdf_path = os.path.join(current_dir, f"{os.path.basename(output_name)}.pdf")
    if os.path.exists(pdf_path):
        print(f"PDF generated successfully at: {pdf_path}")
        # Comment out the cleanup code to keep auxiliary files for debugging
        # for ext in [".aux", ".log", ".out"]:
        #     aux_file = os.path.join(current_dir, f"{os.path.basename(output_name)}{ext}")
        #     if os.path.exists(aux_file):
        #          os.remove(aux_file)
    else:
        raise Exception(f"PDF file not created at: {pdf_path}")

def main():
    # Use environment variable if provided, otherwise use default path
    md_file = os.getenv('MARKDOWN_FILE', "Docs/analysis/users/daffa.padantya12/formatted-analysis-2025-03-11.md")
    output_name = os.path.splitext(md_file)[0]
    
    model = setup()
    
    # Ensure the output directory exists
    os.makedirs(os.path.dirname(md_file) or '.', exist_ok=True)

    with open(md_file, 'r', encoding='utf-8') as f:
        md_content = f.read()
    
    latex_content = md_to_latex(model, md_content)
    create_pdf(latex_content, output_name)

if __name__ == "__main__":
    main()