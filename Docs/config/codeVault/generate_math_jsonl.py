import os
from typing import List
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate
from dotenv import load_dotenv

def setup_gemini():
    """Setup Gemini model"""
    load_dotenv()
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-pro-exp-02-05",
        temperature=0.7,
        google_api_key=os.getenv("GOOGLE_API_KEY")
    )
    return llm

def create_prompt_template() -> ChatPromptTemplate:
    """Create the prompt template for generating JSONL content"""
    template = """You are an AI assistant that helps convert math teaching transcripts into JSONL format.
    Given the following transcript of a math teaching video, create a JSONL entry with:
    1. A natural question in Indonesian that could have prompted this explanation
    2. The exact explanation from the transcript as the answer
    
    Transcript:
    {transcript}
    
    Generate the content in this exact format:
    {{"text": "You are a math teacher using the Gasing method\\n\\nHuman: [generated question in Indonesian]\\n\\nAssistant: [explanation from transcript]"}}
    """
    
    return ChatPromptTemplate.from_template(template)

def process_transcript(transcript_path: str, llm, prompt_template: ChatPromptTemplate) -> str:
    """Process a single transcript and return JSONL content"""
    with open(transcript_path, 'r', encoding='utf-8') as f:
        transcript = f.read().strip()
    
    # Generate JSONL content
    chain = prompt_template | llm
    result = chain.invoke({"transcript": transcript})
    return result.content

def process_all_transcripts(transcript_dir: str, output_file: str):
    """Process all transcript files and generate JSONL"""
    llm = setup_gemini()
    prompt_template = create_prompt_template()
    
    # Create output directory if it doesn't exist
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    processed_files = []
    with open(output_file, 'w', encoding='utf-8') as out_f:
        for filename in os.listdir(transcript_dir):
            if filename.endswith('.txt'):
                if processed_files:
                    break
                    
                transcript_path = os.path.join(transcript_dir, filename)
                try:
                    jsonl_content = process_transcript(transcript_path, llm, prompt_template)
                    # Clean up the content by removing markers and "json" text
                    jsonl_content = jsonl_content.replace('```jsonl', '').replace('```', '').replace('json', '').strip()
                    out_f.write(jsonl_content)
                    processed_files.append(filename)
                    print(f"Processed: {filename}")
                except Exception as e:
                    print(f"Error processing {filename}: {str(e)}")

def main():
    transcript_dir = "/Users/dewanekonominasional/Documents/GitHub/redux_todo_in_astro/Docs/to-do-plan/data/processed/transcript"
    output_file = "/Users/dewanekonominasional/Documents/GitHub/redux_todo_in_astro/Docs/to-do-plan/data/processed/math_qa.jsonl"
    
    process_all_transcripts(transcript_dir, output_file)
    print(f"JSONL file generated at: {output_file}")

if __name__ == "__main__":
    main()