import time
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage
from pathlib import Path
import tiktoken

os.environ["GOOGLE_API_KEY"] = "YOUR_API_KEY"
llm = ChatGoogleGenerativeAI(model="gemini-pro")

def count_tokens(text, model_name="gpt-3.5-turbo"):
    encoding = tiktoken.encoding_for_model(model_name)
    return len(encoding.encode(text))

def convert_md_to_latex(md_content, ref_latex):
    max_chunk_tokens = 300  # Ukuran chunk sangat kecil
    overlap_tokens = 50  # Overlap token dikurangi
    chunks = []
    
    paragraphs = md_content.split('\n\n')
    current_chunk = []
    current_tokens = 0
    
    for para in paragraphs:
        para_tokens = count_tokens(para)
        if current_tokens + para_tokens > max_chunk_tokens:
            chunks.append('\n\n'.join(current_chunk))
            current_chunk = [para]
            current_tokens = para_tokens
        else:
            current_chunk.append(para)
            current_tokens += para_tokens
    
    if current_chunk:
        chunks.append('\n\n'.join(current_chunk))
    
    latex_parts = []
    previous_context = ""
    start_chunk = 0
    
    if os.path.exists("temp_latex.txt"):
        with open("temp_latex.txt", "r") as f:
            temp_latex = f.read()
            latex_parts.append(temp_latex)
        start_chunk = len(temp_latex.split("---chunk---")) - 1
    
    for i, chunk in enumerate(chunks[start_chunk:]):
        chunk_index = start_chunk + i
        
        # Tambahkan overlap
        if i > 0:
            overlap = ' '.join(chunks[chunk_index -1].split(' ')[-overlap_tokens:])
            chunk = overlap + ' \n\n' + chunk
            
        prompt = HumanMessage(content=f"""
        Convert this Markdown content to LaTeX format.
        Use this LaTeX document as reference for formatting and style:
        {ref_latex}
        Previous context:
        {previous_context}
        Convert this content:
        {chunk}
        Important: Maintain LaTeX document structure and formatting exactly as in the reference.
        """)
        
        retries = 5
        for attempt in range(retries):
            try:
                response = llm.invoke([prompt])
                latex_parts.append(response.content + "---chunk---")
                previous_context = '\n\n'.join(chunks[chunk_index].split('\n\n')[-2:]) if chunk_index > 0 else ""
                
                with open("temp_latex.txt", "w") as f:
                    f.write("".join(latex_parts))
                
                break
            except Exception as e:
                print(f"Error converting chunk {chunk_index}, attempt {attempt + 1}: {e}")
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)
                else:
                    print(f"Failed to convert chunk {chunk_index} after {retries} attempts.")
                    return None
    
    final_latex = "".join(latex_parts).replace("---chunk---", "")
    
    if os.path.exists("temp_latex.txt"):
        os.remove("temp_latex.txt")
    
    return final_latex
    
def add_line_numbers(latex_content, filename):
    lines = latex_content.split('\n')
    total_lines = len(lines)
    ref_line = f"```latex:%7Bfilename%7D%23L1-%7Btotal_lines%7D%22```"
    return f"{ref_line}\n{latex_content}\n```"

def process_file(md_path):
    try:
        with open(md_path, 'r') as file:
            md_content = file.read()
            
        ref_latex_path = "/Users/dewanekonominasional/Documents/GitHub/redux_todo_in_astro/Docs/to-do-plan/docs/reports/daily/2025-02/[report]2025-02-19.tex"
        with open(ref_latex_path, 'r') as file:
            ref_latex = file.read()

        latex_content = convert_md_to_latex(md_content, ref_latex)
        
        if latex_content is None:
            return None, None

        base_name = Path(md_path).stem
        latex_filename = f"[report1]{base_name}.tex"
        output_path = Path(md_path).parent / latex_filename

        numbered_content = add_line_numbers(latex_content, str(output_path))

        with open(output_path, 'w') as file:
            file.write(latex_content)

        ref_path = output_path.with_suffix('.ref.tex')
        with open(ref_path, 'w') as file:
            file.write(numbered_content)

        return str(output_path), str(ref_path)

    except FileNotFoundError:
        print(f"Error: File not found at {md_path}")
        return None, None
    except Exception as e:
        print(f"An error occurred: {e}")
        return None, None

if __name__ == "__main__":
    md_file = "/Users/dewanekonominasional/Documents/GitHub/redux_todo_in_astro/Docs/to-do-plan/docs/reports/daily/2025-02/[report]2025-02-21.md"
    latex_file, ref_file = process_file(md_file)
    if latex_file and ref_file:
        print(f"LaTeX file generated: {latex_file}")
        print(f"Reference file generated: {ref_file}")
    else:
        print("Conversion failed.")