META_TEMPLATE_PROMPT = """
You are a document specialist. Create a comprehensive document following this structure:

{content}

Document Structure:
1. Document Header
   - Title and Type
   - Metadata (Authors, Date, Version, Repository, Hash, Category)

2. Computational Trinitarianism Framework
   a. Logic Layer (Abstract Specification)
      - Context & Vision
      - Goals & Functions
      - Success Criteria
      - Knowledge Integration

   b. Implementation Layer (Concrete Process)
      - Resource Matrix
      - Four-Stage Development:
        * Early Success
        * Fail Early, Fail Safe
        * Convergence
        * Demonstration

   c. Evidence Layer (Realistic Outcomes)
      - Measurement Framework
      - Value Realization
      - Integration Points

3. Management Framework
   - Budget Structure
   - Timeline Management
   - Integration Matrix

4. Supporting Documentation
   - References
   - Change History

Requirements:
1. Include mermaid diagrams for visual representation
2. Provide measurable metrics and evidence points
3. Maintain traceability across layers
4. Document dependencies and assumptions
5. Show clear section integration
"""

VALIDATION_CRITERIA = {
    "completeness": "All sections must be filled with relevant content",
    "consistency": "Maintain alignment across Logic, Implementation, and Evidence layers",
    "measurability": "Include specific, measurable metrics for each outcome",
    "traceability": "Clear links between requirements, implementation, and evidence",
    "integration": "Demonstrated connections between different sections"
}

SECTION_PROMPTS = {
    "executive_summary": "Create an executive summary covering purpose, approach, and outcomes",
    "abstract_specification": "Detail the logical framework with problem space and goals",
    "concrete_implementation": "Outline implementation process and workflow stages",
    "realistic_outcomes": "Specify measurable outcomes and evidence collection",
    "budget_management": "Define budget structure and control mechanisms",
    "timeline_management": "Detail temporal framework and control systems",
    "appendix": "Compile references and change history"
}