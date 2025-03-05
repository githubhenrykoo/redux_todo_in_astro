import os
import glob
import time
from datetime import datetime
import google.generativeai as genai

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

def analyze_content(model, content, query, prompt_template):
    chunks = chunk_content(content)
    all_analyses = []
    
    for i, chunk in enumerate(chunks, 1):
        # Add delay between API calls
        if i > 1:
            time.sleep(2)  # 2 second delay between requests
        
        chunk_prompt = prompt_template.format(
            query=query,
            content=chunk,
            chunk_info=f"(Part {i} of {len(chunks)})" if len(chunks) > 1 else ""
        )
        
        response = model.generate_content(chunk_prompt)
        all_analyses.append(response.text)
    
    if len(all_analyses) > 1:
        # Add delay before summary request
        time.sleep(2)
        summary_prompt = f"""
        Synthesize these separate analyses into one coherent analysis:

        {'\n\n'.join(all_analyses)}

        Provide a unified analysis that covers all parts.
        """
        final_response = model.generate_content(summary_prompt)
        return final_response.text
    
    return all_analyses[0]

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
    group_prompt_template = """
    Analyze this team's git log {chunk_info} and {query}:

    {content}

    Please provide:
    1. A summary of key changes
    2. Team collaboration patterns
    3. Project progress analysis
    4. Recommendations for the team
    """

    analysis = analyze_content(model, group_content, query, group_prompt_template)
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

        user_prompt = f"""
        Analyze this developer's git activity and {query}:

        {user_content}

        Please provide:
        1. Individual contribution summary
        2. Work patterns and focus areas
        3. Technical expertise demonstrated
        4. Specific recommendations
        """

        response = model.generate_content(user_prompt)
        os.makedirs(f'Docs/analysis/users/{username}', exist_ok=True)
        with open(f'Docs/analysis/users/{username}/analysis-{datetime.now().strftime("%Y-%m-%d")}.md', 'w') as f:
            f.write(f"# Developer Analysis - {username}\nGenerated at: {datetime.now()}\n\n{response.text}")
