# Base template structure
BASE_TEMPLATE = """
# {title}

**Type:** {document_type}

**1. Document Header**
{header_content}

**Executive Summary**
{executive_summary}
"""

# Section templates
HEADER_TEMPLATE = """
**1.1 Title and Type**
* **Title:** {title}
* **Type:** {document_type}

**1.2 Metadata**
* **Authors:** {authors}
* **Date:** {date}
* **Version:** {version}
* **Repository:** {repository}
* **Hash:** {hash}
* **Category:** {category}
"""

FRAMEWORK_TEMPLATE = """
**2. {framework_name} Framework**

**2.a. Logic Layer**
{logic_content}

**2.b. Implementation Layer**
{implementation_content}

**2.c. Evidence Layer**
{evidence_content}
"""

MANAGEMENT_TEMPLATE = """
**3. Management Framework**
* **Budget Structure:**
{budget_content}

* **Timeline Management:**
{timeline_content}

* **Integration Matrix:**
{integration_content}
"""

DOCUMENTATION_TEMPLATE = """
**4. Supporting Documentation**
* **References:**
{references}

* **Change History:**
{change_history}
"""

# Validation criteria for each section
VALIDATION_CRITERIA = {
    'header': ['title', 'type', 'metadata'],
    'executive_summary': ['context', 'goals', 'approach', 'expected_outcomes'],
    'framework': ['logic', 'implementation', 'evidence'],
    'management': ['budget', 'timeline', 'integration'],
    'documentation': ['references', 'changes']
}

# Section-specific prompts
SECTION_PROMPTS = {
    'header': 'Generate a document header with title, type, and metadata...',
    'executive_summary': 'Create a concise executive summary that covers...',
    'framework': 'Develop a framework section that includes...',
    'management': 'Structure the management section with...',
    'documentation': 'Compile supporting documentation including...'
}

# Template assembly function
def assemble_template(sections):
    return '\n'.join([
        BASE_TEMPLATE,
        FRAMEWORK_TEMPLATE,
        MANAGEMENT_TEMPLATE,
        DOCUMENTATION_TEMPLATE
    ]).format(**sections)

# Meta template prompt
META_TEMPLATE_PROMPT = """
Please analyze the following content and generate a refined version following these guidelines:

1. Structure: Follow the template structure defined above
2. Sections: Ensure all required sections are present and properly formatted
3. Integration: Maintain clear connections between different layers
4. Metrics: Include specific, measurable outcomes
5. Visualization: Add relevant diagrams where appropriate

Content to analyze:
{content}
"""