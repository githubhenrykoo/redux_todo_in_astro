import os
import subprocess
from datetime import datetime
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage

# Set your Gemini API key (Make sure to replace 'YOUR_GEMINI_API_KEY')
os.environ["GOOGLE_API_KEY"] = "AIzaSyBZ52gRnYBjfyyh4jiEWscKoRfTx-j4YEQ"
llm = ChatGoogleGenerativeAI(model="gemini-pro")

# Function to get user input for the report date
def get_report_date():
    while True:
        date_str = input("Enter the report date (YYYY-MM-DD): ")
        try:
            datetime.strptime(date_str, "%Y-%m-%d")  # Validate format
            return date_str
        except ValueError:
            print("Invalid date format. Please use YYYY-MM-DD.")

# Function to read the markdown file
def read_markdown_file(file_path):
    if not os.path.exists(file_path):
        print(f"Error: File '{file_path}' not found.")
        return None
    with open(file_path, "r", encoding="utf-8") as file:
        return file.read()

# Function to convert markdown to LaTeX using Gemini API
def convert_md_to_tex(markdown_content):
    chat = ChatGoogleGenerativeAI(model="gemini-pro")
    prompt = f"""
    You are a LaTeX document formatter. Convert the following structured Markdown content into a properly formatted LaTeX document. Ensure the following:

    - Use the appropriate document class, title, and sections.
    - [!IMPORTANT] Correctly format bold text, italic text, etc. (** --> \textbf, * --> \textit)
    - Correctly format tables, numbering, bullet points, and code blocks.
    - Maintain the full content without reduction.
    - Convert mermaid graphs into TikZ pictures using the specified styles in vertical style:
        \\tikzset{{
            block/.style={{
                rectangle,
                draw=darkblue,
                text width=7em,
                text centered,
                rounded corners,
                minimum height=2em,
                fill=lightgray!10,
                font=\\small
            }},
            process/.style={{
                rectangle,
                draw=forestgreen,
                text width=6em,
                text centered,
                rounded corners,
                fill=lightgray!30,
                minimum height=2em,
                font=\\small
            }},
            line/.style={{
                draw,
                -latex',
                font=\\footnotesize
            }},
            cloud/.style={{
                draw,
                ellipse,
                minimum width=2cm,
                minimum height=1cm,
                fill=lightgray!20
            }},
            state/.style={{
                rectangle,
                draw=uiblue,
                text width=8em,
                text centered,
                rounded corners,
                fill=uiblue!10,
                minimum height=2.5em,
                font=\\small
            }}
        }} [!IMPORTANT] using "node distance=2cm", "below=1.2cm"
    - Use “Docs/to-do-plan/docs/reports/daily/2025-02/[report]2025-02-19.tex” as a reference for the TikZ picture structure.

    Markdown Content:
    {markdown_content}
    """
    response = chat([HumanMessage(content=prompt)])
    return response.content if response else None

# Function to write LaTeX content to file
def save_tex_file(tex_content, tex_path):
    with open(tex_path, "w", encoding="utf-8") as file:
        file.write(tex_content)

# Function to compile LaTeX to PDF using pdflatex
def compile_tex_to_pdf(tex_path, output_dir):
    try:
        # Get the directory of the tex file
        tex_dir = os.path.dirname(tex_path)
        
        # Run pdflatex twice to ensure proper cross-references
        for _ in range(2):
            subprocess.run(
                ["/Library/TeX/texbin/pdflatex", "-interaction=nonstopmode", "-output-directory", tex_dir, tex_path],
                check=True,
                capture_output=True,
                text=True
            )
        
        pdf_path = tex_path.replace('.tex', '.pdf')
        print(f"PDF successfully created: {pdf_path}")
        
        # Clean up auxiliary files
        for ext in [".aux", ".log", ".out"]:
            aux_file = tex_path.replace(".tex", ext)
            if os.path.exists(aux_file):
                os.remove(aux_file)
                
    except subprocess.CalledProcessError as e:
        print(f"Error: Failed to convert the LaTeX file.\nError message: {e.stderr}")

# Main function to execute the workflow
def main():
    date_str = get_report_date()
    base_path = "Docs/to-do-plan/docs/reports/daily/2025-02/"
    md_path = f"{base_path}[report]{date_str}.md"
    tex_path = f"{base_path}[report]{date_str}.tex"
    pdf_output_dir = base_path

    # Read markdown file
    md_content = read_markdown_file(md_path)
    if md_content is None:
        return

    # Convert markdown to LaTeX
    tex_content = convert_md_to_tex(md_content)
    if not tex_content:
        print("Error: Failed to generate LaTeX content.")
        return

    # Save the LaTeX file
    save_tex_file(tex_content, tex_path)

    # Convert LaTeX to PDF
    compile_tex_to_pdf(tex_path, pdf_output_dir)

if __name__ == "__main__":
    main()
