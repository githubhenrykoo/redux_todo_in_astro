GROUP_ANALYSIS_PROMPT = """
Analyze this team's git log {chunk_info} and {query}:

{content}

Please provide:
1. A summary of key changes
2. Team collaboration patterns
3. Project progress analysis
4. Recommendations for the team
"""