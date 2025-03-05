import os
import glob
from datetime import datetime
import google.generativeai as genai

# Configure Gemini
genai.configure(api_key="AIzaSyBZ52gRnYBjfyyh4jiEWscKoRfTx-j4YEQ")
model = genai.GenerativeModel('gemini-2.0-flash')

# Analyze group log
log_files = glob.glob('Docs/log/git-log-*.md')  # Updated input path
if log_files:
    latest_log = max(log_files)
    with open(latest_log, 'r') as f:
        group_content = f.read()

    query = 'Summarize the main changes'
    group_prompt = f"""
    Analyze this team's git log and {query}:

    {group_content}

    Please provide:
    1. A summary of key changes
    2. Team collaboration patterns
    3. Project progress analysis
    4. Recommendations for the team
    """

# Update paths in group analysis
    response = model.generate_content(group_prompt)
    os.makedirs('Docs/analysis/group', exist_ok=True)
    with open(f'Docs/analysis/group/team-analysis-{datetime.now().strftime("%Y-%m-%d")}.md', 'w') as f:
        f.write(f"# Team Analysis\nGenerated at: {datetime.now()}\n\n{response.text}")

# Analyze individual user logs
user_dirs = glob.glob('Docs/log/users/*/')  # Updated input path
for user_dir in user_dirs:
    username = os.path.basename(os.path.dirname(user_dir))
    if username == '.gitkeep':
        continue

    user_logs = glob.glob(f'{user_dir}git-log-*.md')  # Path is now relative to Docs/log/users/
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
