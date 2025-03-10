import os
import glob
import time
from datetime import datetime
import google.generativeai as genai
from google.api_core import exceptions
from Docs.config.prompts.group_critique import GROUP_CRITIQUE_PROMPT
from Docs.config.prompts.user_critique import USER_CRITIQUE_PROMPT
from Docs.config.prompts.refinement import REFINEMENT_PROMPT

def generate_with_retry(model, prompt, max_retries=3, initial_delay=5):
    for attempt in range(max_retries):
        try:
            if attempt > 0:
                time.sleep(initial_delay * (2 ** attempt))
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

def refine_analysis(model, analysis_content, critique_prompt):
    # Generate critique
    critique = generate_with_retry(model, critique_prompt)
    if not critique:
        return analysis_content

    # Use critique to refine
    refined = generate_with_retry(
        model,
        REFINEMENT_PROMPT.format(
            analysis_content=analysis_content,
            critique=critique
        )
    )
    return refined if refined else analysis_content

# Configure Gemini
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
model = genai.GenerativeModel('gemini-2.0-flash')

# Refine group analysis
group_files = glob.glob('Docs/analysis/group/team-analysis-*.md')
if group_files:
    latest_analysis = max(group_files)
    with open(latest_analysis, 'r') as f:
        analysis_content = f.read()
    
    refined_analysis = refine_analysis(model, analysis_content, GROUP_CRITIQUE_PROMPT)
    if refined_analysis:
        refined_path = latest_analysis.replace('team-analysis-', 'refined-team-analysis-')
        with open(refined_path, 'w') as f:
            f.write(f"# Refined Team Analysis\nGenerated at: {datetime.now()}\n\n{refined_analysis}")

# Refine individual analyses
user_dirs = glob.glob('Docs/analysis/users/*/')
for user_dir in user_dirs:
    username = os.path.basename(os.path.dirname(user_dir))
    if username == '.gitkeep':
        continue

    analysis_files = glob.glob(f'{user_dir}analysis-*.md')
    if analysis_files:
        latest_analysis = max(analysis_files)
        with open(latest_analysis, 'r') as f:
            analysis_content = f.read()

        refined_analysis = refine_analysis(model, analysis_content, USER_CRITIQUE_PROMPT)
        if refined_analysis:
            refined_path = latest_analysis.replace('analysis-', 'refined-analysis-')
            with open(refined_path, 'w') as f:
                f.write(f"# Refined Developer Analysis - {username}\nGenerated at: {datetime.now()}\n\n{refined_analysis}")
