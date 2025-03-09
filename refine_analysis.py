import os
import glob
import time
from datetime import datetime
import google.generativeai as genai
from google.api_core import exceptions
from Docs.config.prompts.meta_template import (
    META_TEMPLATE_PROMPT,
    assemble_template
)

def generate_with_retry(model, prompt, max_retries=3, initial_delay=5):
    for attempt in range(max_retries):
        try:
            if attempt > 0:
                time.sleep(initial_delay * (2 ** attempt))
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Error: {str(e)}")
            if attempt == max_retries - 1:
                raise
    return None

# Configure Gemini
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
model = genai.GenerativeModel('gemini-2.0-flash')

# Read and analyze git logs
with open(f'Docs/log/git-log-{datetime.now().strftime("%Y-%m-%d")}.md', 'r') as f:
    git_content = f.read()

# First, analyze using META_TEMPLATE_PROMPT
analysis = generate_with_retry(model, META_TEMPLATE_PROMPT.format(content=git_content))

if analysis:
    # Format analysis using template structure
    sections = {
        'title': 'Git Repository Analysis Report',
        'document_type': 'Development Analysis',
        'authors': 'AI Analysis System',
        'date': datetime.now().strftime('%Y-%m-%d'),
        'version': '1.0',
        'repository': os.getenv('GITHUB_REPOSITORY', 'Current Repository'),
        'hash': os.getenv('GITHUB_SHA', 'Current Commit'),
        'category': 'Git Analysis',
        'header_content': 'Git Repository Analysis Results',
        'executive_summary': analysis[:500],  # First part as summary
        'framework_name': 'Git Analysis',
        'logic_content': analysis[500:],  # Rest as detailed analysis
        'implementation_content': '',
        'evidence_content': '',
        'budget_content': '',
        'timeline_content': '',
        'integration_content': '',
        'references': '',
        'change_history': ''
    }
    
    # Generate formatted report
    formatted_analysis = assemble_template(sections)
    
    # Write refined analysis
    with open(f'Docs/analysis/refined-git-analysis-{datetime.now().strftime("%Y-%m-%d")}.md', 'w') as f:
        f.write(formatted_analysis)
