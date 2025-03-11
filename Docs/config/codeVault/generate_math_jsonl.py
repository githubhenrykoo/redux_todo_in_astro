import os
from typing import List
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate
from dotenv import load_dotenv
import time
from tenacity import retry, stop_after_attempt, wait_exponential
from langchain.output_parsers import StructuredOutputParser, ResponseSchema

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
    Given the following transcript of a math teaching video:
    1. Correct any typos and unclear explanations in Indonesian
    2. Use proper Indonesian mathematical terms
    3. Make sure the explanation is clear and step-by-step
    4. Keep the mathematical method (Gasing) intact
    5. Format numbers clearly (avoid using hyphens like 10-2, instead use "10 ditambah 2")
    
    Transcript:
    {transcript}
    
    First, correct the transcript to proper Indonesian, then generate the content in this exact format:
    {{"text": "You are a math teacher using the Gasing method\\n\\nHuman: [generated question in Indonesian]\\n\\nAssistant: [corrected explanation with proper Indonesian]"}}
    
    The explanation should:
    - Use proper Indonesian spelling (e.g., "delapan" not "dilapan")
    - Have clear step-by-step instructions
    - Use proper mathematical terms
    - Maintain a clear flow of explanation
    - End with a clear conclusion
    """
    
    return ChatPromptTemplate.from_template(template)

def validate_jsonl_format(content: str) -> bool:
    """Validate if the content follows correct JSONL format"""
    try:
        # Parse the content as JSON
        parsed = json.loads(content)
        
        # Check required structure
        if not isinstance(parsed, dict) or 'text' not in parsed:
            return False
            
        # Check if text contains required components
        text = parsed['text']
        if not all(x in text for x in ['You are a math teacher using the Gasing method', 'Human:', 'Assistant:']):
            return False
            
        return True
    except json.JSONDecodeError:
        return False

@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=4, max=60)
)
def process_transcript(transcript_path: str, llm, prompt_template: ChatPromptTemplate) -> str:
    """Process a single transcript with retry mechanism and typo correction"""
    with open(transcript_path, 'r', encoding='utf-8') as f:
        transcript = f.read().strip()
    
    try:
        chain = prompt_template | llm
        result = chain.invoke({"transcript": transcript})
        content = result.content.replace('```jsonl', '').replace('```', '').replace('json', '').strip()
        
        # Validate JSONL format
        if not validate_jsonl_format(content):
            raise ValueError(f"Invalid JSONL format for {transcript_path}")
        
        return content
    except Exception as e:
        print(f"Attempt failed for {transcript_path}: {str(e)}")
        raise

def process_all_transcripts(transcript_dir: str, output_file: str):
    """Process all transcript files and generate JSONL"""
    llm = setup_gemini()
    prompt_template = create_prompt_template()
    
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    valid_entries = []
    failed_files = []
    
    for filename in os.listdir(transcript_dir):
        if filename.endswith('.txt'):
            transcript_path = os.path.join(transcript_dir, filename)
            try:
                print(f"Processing: {filename}")
                jsonl_content = process_transcript(transcript_path, llm, prompt_template)
                if validate_jsonl_format(jsonl_content):
                    valid_entries.append(jsonl_content)
                    print(f"Successfully processed: {filename}")
                else:
                    failed_files.append(filename)
                    print(f"Invalid JSONL format for: {filename}")
                time.sleep(5)
            except Exception as e:
                failed_files.append(filename)
                print(f"Failed to process {filename} after all retries: {str(e)}")
                continue
    
    # Write valid entries to output file
    with open(output_file, 'w', encoding='utf-8') as out_f:
        for entry in valid_entries:
            out_f.write(entry + '\n')
    
    # Report results
    print(f"\nProcessing complete:")
    print(f"Successfully processed: {len(valid_entries)} files")
    if failed_files:
        print(f"Failed to process: {len(failed_files)} files")
        print("Failed files:", ', '.join(failed_files))

def main():
    # Get script directory for relative paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # Navigate from script location to transcript directory using relative path
    transcript_dir = os.path.normpath(os.path.join(script_dir, "../../../Docs/to-do-plan/data/processed/transcript"))
    # Output relative to script location
    output_file = os.path.join(script_dir, "math_qa.jsonl")
    
    process_all_transcripts(transcript_dir, output_file)
    print(f"JSONL file generated at: {output_file}")

if __name__ == "__main__":
    main()