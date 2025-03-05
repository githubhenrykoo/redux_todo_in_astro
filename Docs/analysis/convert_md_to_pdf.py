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

def md_to_latex(model, md_content):
    prompt = """
    You are a LaTeX document formatter. Convert the following structured Markdown content into a properly formatted LaTeX document. Ensure the following:

    - Do not use ```latex ``` or any similar code block delimiters.
    - Use the appropriate document class, title, and sections.
    - [!IMPORTANT] Correctly format bold text, italic text, etc. (** --> \\textbf, * --> \\textit)
    - Correctly format tables, numbering, bullet points, and code blocks.
    - Maintain the full content without reduction.
    - Convert mermaid graphs into TikZ pictures using the specified styles in vertical style ("below of"):

    % Custom styles for all diagrams
    \\tikzset{
        block/.style={
            rectangle, draw=darkblue, text width=7em,
            text centered, rounded corners,
            minimum height=2em, fill=lightgray!10,
            font=\\small
        },
        process/.style={
            rectangle, draw=forestgreen, text width=6em,
            text centered, rounded corners,
            fill=lightgray!30, minimum height=2em,
            font=\\small
        },
        line/.style={
            draw, -latex',
            font=\\footnotesize
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
            font=\\small
        }
    }
    % Color definitions:
    % - lightgray: RGB(240,240,240)
    % - darkblue: RGB(0,0,139)
    % - forestgreen: RGB(34,139,34)
    % - uiblue: RGB(66,139,202)

    Markdown Content:
    """ + md_content

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

def main():
    # Remove argument parser and use direct path
    md_file = "Docs/analysis/gemini-analysis-2025-03-04.md"
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