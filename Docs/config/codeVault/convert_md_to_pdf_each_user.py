

import os
import google.generativeai as genai
import subprocess
from dotenv import load_dotenv
import argparse

def setup():
    # Load environment variables
    load_dotenv()
    
    # Configure Gemini
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not set in .env file")
    
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-2.0-pro-exp-02-05')
    
def format_latex_content(content):
    # Split content at the Conclusion section to insert multicols
    parts = content.split('\\section{Conclusion:}')
    main_content = parts[0]
    conclusion = parts[1] if len(parts) > 1 else ""
    
    # Add multicolumn formatting without re-adding the section header
    formatted_content = (
        "\\begin{document}\n\n"
        "\\maketitle\n"
        "\\begin{multicols}{2}\n\n"
        f"{main_content}\n"
        "\\end{multicols}\n"
        "\\noindent\\rule{\\textwidth}{0.4pt}\n\n"
        f"\\section{{Conclusion:}}{conclusion}"  # Keep the original conclusion section
    )
    
    return formatted_content

def md_to_latex(model, md_content):
    prompt = """
    You are a LaTeX document formatter. Convert the following structured Markdown content into a properly formatted LaTeX document. Ensure the following:

    - Do not use ```latex ``` or any similar code block delimiters.
    - Use the appropriate document class, title, and sections.
    - Make sure there is title that correctly formats the title
    - [!IMPORTANT] Correctly format bold text, italic text, etc. (** --> \\textbf, * --> \\textit)
    - Correctly format tables, numbering, bullet points, and code blocks.
    - Maintain the full content without reduction.
    - Convert mermaid graphs into TikZ pictures using the specified styles in vertical style ("below of")
    Start with these packages and settings:

    \\documentclass[10pt,a4paper]{article}
    \\usepackage[utf8]{inputenc}
    \\usepackage[T1]{fontenc}
    \\usepackage{lmodern}
    \\usepackage{microtype}
    \\usepackage{graphicx}
    \\usepackage[dvipsnames]{xcolor}
    \\usepackage{enumitem}
    \\usepackage{titlesec}
    \\usepackage[margin=0.6in]{geometry}
    \\usepackage{multicol}
    \\usepackage{fancyhdr}
    \\usepackage{lipsum}
    \\usepackage{hyperref}

    Use these specific LaTeX style settings:
    % Define colors
    \\definecolor{headingcolor}{RGB}{70,130,180}
    \\definecolor{subheadingcolor}{RGB}{100,149,237}
    \\definecolor{textcolor}{RGB}{50,50,50}

    % Style for headings - more compact
    \\titleformat{\\section}{\\normalsize\\bfseries\\color{headingcolor}}{\\thesection}{0.5em}{}
    \\titleformat{\\subsection}{\\small\\bfseries\\color{subheadingcolor}}{\\thesubsection}{0.5em}{}
    \\titleformat{\\subsubsection}{\\footnotesize\\bfseries\\color{subheadingcolor}}{\\thesubsubsection}{0.5em}{}

    % Adjust spacing - very tight
    \\titlespacing*{\\section}{0pt}{5pt}{2pt}
    \\titlespacing*{\\subsection}{0pt}{4pt}{1pt}
    \\titlespacing*{\\subsubsection}{0pt}{3pt}{1pt}

    % Customize bullet points - very compact
    \\setlist[itemize]{noitemsep, topsep=0pt, parsep=0pt, partopsep=0pt, leftmargin=*}
    \\setlist[enumerate]{noitemsep, topsep=0pt, parsep=0pt, partopsep=0pt, leftmargin=*}

    % Page style
    \\pagestyle{fancy}
    \\fancyhf{}
    \\renewcommand{\\headrulewidth}{0pt}
    \\fancyfoot[C]{\\small\\thepage}

    Markdown Content:
    """ + format_latex_content(md_content)

    response = model.generate_content(prompt)
    return response.text
    
def create_pdf(latex_content, output_name):
    # Clean up the LaTeX content
    latex_content = latex_content.strip()  # Remove leading/trailing whitespace
    if latex_content.startswith('```latex'):
        latex_content = latex_content[8:]  # Remove ```latex
    if latex_content.endswith('```'):
        latex_content = latex_content[:-3]  # Remove closing ```
    
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
        #         os.remove(aux_file)
    else:
        raise Exception(f"PDF file not created at: {pdf_path}")

def get_latest_md_file(user_folder):
    """Get the most recent refined-analysis-*.md file from a user's folder"""
    md_files = []
    for file in os.listdir(user_folder):
        if file.startswith('refined-analysis-') and file.endswith('.md'):
            full_path = os.path.join(user_folder, file)
            # Extract date from filename (YYYY-MM-DD)
            date_str = file.replace('refined-analysis-', '').replace('.md', '')
            md_files.append((full_path, date_str))
    
    if not md_files:
        return None
    
    # Sort by date string (YYYY-MM-DD format will sort correctly)
    return sorted(md_files, key=lambda x: x[1], reverse=True)[0][0]

def main():
    # Base directories
    users_dir = "Docs/analysis/users"
    output_dir = "Docs/analysis/progress_reports"
    
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    model = setup()
    
    # Process each user folder
    for user_folder in os.listdir(users_dir):
        user_path = os.path.join(users_dir, user_folder)
        if not os.path.isdir(user_path):
            continue
            
        # Get latest MD file from user's folder
        latest_md = get_latest_md_file(user_path)
        if not latest_md:
            print(f"No markdown files found for user: {user_folder}")
            continue
            
        # Generate output name: userFolder_fileName.pdf
        md_filename = os.path.basename(latest_md)
        output_name = f"{user_folder}_{os.path.splitext(md_filename)[0]}"
        output_path = os.path.join(output_dir, output_name)
        
        print(f"Processing {latest_md} for user {user_folder}")
        
        with open(latest_md, 'r', encoding='utf-8') as f:
            # Skip first 5 lines and read the rest
            lines = f.readlines()[5:]
            md_content = ''.join(lines)
        
        latex_content = md_to_latex(model, md_content)
        create_pdf(latex_content, output_path)

if __name__ == "__main__":
    main()