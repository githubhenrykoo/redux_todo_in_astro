import os
import glob
import time
from datetime import datetime
import google.generativeai as genai
from google.api_core import exceptions
from Docs.config.prompts.group_analysis import GROUP_ANALYSIS_PROMPT
from Docs.config.prompts.user_analysis import USER_ANALYSIS_PROMPT
from Docs.config.prompts.summary import SUMMARY_PROMPT

def generate_with_retry(model, prompt, max_retries=3, initial_delay=5):
    for attempt in range(max_retries):
        try:
            if attempt > 0:
                time.sleep(initial_delay * (2 ** attempt))  # Exponential backoff
            response = model.generate_content(prompt)
            return response.text
        except exceptions.ResourceExhausted:
            if attempt == max_retries - 1:
                raise
            print(f"Rate limit hit, retrying in {initial_delay * (2 ** (attempt + 1))} seconds...")
        except Exception as e:
            print(f"Error: {str(e)}")
            if attempt == max_retries - 1:
                raise
    return None

def analyze_content(model, content, query, prompt_template):
    chunks = chunk_content(content)
    all_analyses = []
    
    for i, chunk in enumerate(chunks, 1):
        if i > 1:
            time.sleep(5)  # Increased delay between requests
        
        chunk_prompt = prompt_template.format(
            query=query,
            content=chunk,
            chunk_info=f"(Part {i} of {len(chunks)})" if len(chunks) > 1 else ""
        )
        
        analysis = generate_with_retry(model, chunk_prompt)
        if analysis:
            all_analyses.append(analysis)
    
    if len(all_analyses) > 1:
        time.sleep(5)  # Increased delay before summary
        summary_prompt = SUMMARY_PROMPT.format(content='\n\n'.join(all_analyses))
        return generate_with_retry(model, summary_prompt)
    
    return all_analyses[0] if all_analyses else "Analysis failed due to API limitations"

def chunk_content(content, max_chars=400000):  # Approximately 100k tokens
    lines = content.split('\n')
    chunks = []
    current_chunk = []
    current_size = 0
    
    for line in lines:
        line_size = len(line) + 1  # +1 for newline
        if current_size + line_size > max_chars and current_chunk:
            chunks.append('\n'.join(current_chunk))
            current_chunk = [line]
            current_size = line_size
        else:
            current_chunk.append(line)
            current_size += line_size
    
    if current_chunk:
        chunks.append('\n'.join(current_chunk))
    return chunks

# Configure Gemini
genai.configure(api_key="AIzaSyBZ52gRnYBjfyyh4jiEWscKoRfTx-j4YEQ")
model = genai.GenerativeModel('gemini-2.0-flash')

# Analyze group log
log_files = glob.glob('Docs/log/git-log-*.md')
if log_files:
    latest_log = max(log_files)
    with open(latest_log, 'r') as f:
        group_content = f.read()

    query = 'Summarize the main changes'
    analysis = analyze_content(model, group_content, query, GROUP_ANALYSIS_PROMPT)
    os.makedirs('Docs/analysis/group', exist_ok=True)
    with open(f'Docs/analysis/group/team-analysis-{datetime.now().strftime("%Y-%m-%d")}.md', 'w') as f:
        f.write(f"# Team Analysis\nGenerated at: {datetime.now()}\n\n{analysis}")

# Analyze individual user logs
user_dirs = glob.glob('Docs/log/users/*/')
for user_dir in user_dirs:
    username = os.path.basename(os.path.dirname(user_dir))
    if username == '.gitkeep':
        continue

    user_logs = glob.glob(f'{user_dir}git-log-*.md')
    if user_logs:
        latest_user_log = max(user_logs)
        with open(latest_user_log, 'r') as f:
            user_content = f.read()

        response = model.generate_content(USER_ANALYSIS_PROMPT.format(
            query=query,
            content=user_content
        ))
        os.makedirs(f'Docs/analysis/users/{username}', exist_ok=True)
        with open(f'Docs/analysis/users/{username}/analysis-{datetime.now().strftime("%Y-%m-%d")}.md', 'w') as f:
            f.write(f"# Developer Analysis - {username}\nGenerated at: {datetime.now()}\n\n{response.text}")
