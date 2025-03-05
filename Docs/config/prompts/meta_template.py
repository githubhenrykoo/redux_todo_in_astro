META_TEMPLATE_PROMPT = """
You are a document specialist. Create a comprehensive document following this structure:

{content}

Document Structure:
1. Document Header
   - Title and Type
   - Metadata (Authors, Date, Version, Repository, Category)

2. Executive Summary
   - Logic: Core purpose and objectives
   - Implementation: Key processes
   - Outcomes: Expected results

3. Computational Trinitarianism Framework
   a. Logic Layer (Abstract Specification)
      - Context & Vision
        * Problem Space
        * Goals & Functions
        * Success Criteria
      - Knowledge Integration
        * Local Context
        * Technical Framework

   b. Implementation Layer (Process)
      - Resource Matrix (with mermaid diagram)
      - Development Workflow
        * Stage 1: Early Success
        * Stage 2: Fail Early, Fail Safe
        * Stage 3: Convergence
        * Stage 4: Demonstration

   c. Evidence Layer (Outcomes)
      - Measurement Framework
      - Value Realization
      - Knowledge Assets

4. Integration & Management
   - Content-Process Alignment (with mermaid diagram)
   - Budget Management
     * Financial Structure
     * Cost Framework
     * Control Mechanisms
   - Timeline Management
     * Temporal Structure
     * Schedule Framework
     * Control System
   - Integration Points

5. Conclusion
   - Summary of Achievements
   - Lessons Learned
   - Future Directions

6. Appendix
   - References
   - Change Log

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
    "conclusion": "Summarize achievements, lessons learned, and future directions",
    "appendix": "Compile references and change history"
}