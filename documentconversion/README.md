# Document Conversion Tools

This directory contains Python scripts for converting and loading documents into the MCard database. The tools support both Google Docs and local markdown files.

## Scripts

### 1. Google_Docs_to_MCard.py

This script downloads content from public Google Docs and saves it to the MCard database in JSON format.

#### Features
- Downloads public Google Docs in markdown format
- Automatically extracts document ID from various Google Docs URL formats
- Saves content directly to MCard database with proper JSON structure
- Generates SHA256 hashes for content identification
- Uses standardized timestamp format (sha256|ISO8601_UTC|ASIA)
- Provides detailed processing summaries

#### Usage
```bash
python Google_Docs_to_MCard.py --doc-url DOC_URL [--db-path DB_PATH]

Arguments:
  --doc-url      Google Doc URL or document ID (required)
  --db-path      Custom path for the database file (optional, default: ../public/data/cards.db)
  --format       Output format (default: md, options: docx,odt,rtf,pdf,txt,html,epub,md)
  --all-formats  Download and process all available formats
  --output-dir   Directory to save downloaded files (default: data/downloads)
```

Example:
```bash
# Using a Google Docs URL
python Google_Docs_to_MCard.py --doc-url "https://docs.google.com/document/d/YOUR_DOC_ID/edit"

# Using a document ID directly
python Google_Docs_to_MCard.py --doc-url "YOUR_DOC_ID"

# Specifying a custom database path
python Google_Docs_to_MCard.py --doc-url "YOUR_DOC_ID" --db-path "/custom/path/cards.db"
```

### 2. Local_to_MCard.py

This script processes local markdown files and saves them to the MCard database.

#### Features
- Reads local markdown files
- Saves content to MCard database with proper JSON structure
- Uses the same hashing and timestamp format as Google_Docs_to_MCard.py
- Provides detailed processing summaries

#### Usage
```bash
python Local_to_MCard.py --input FILE_PATH [--db-path DB_PATH]

Arguments:
  --input     Path to the local markdown file (required)
  --db-path   Custom path for the database file (optional, default: ../public/data/cards.db)
```

Example:
```bash
# Process a local markdown file
python Local_to_MCard.py --input "path/to/your/file.md"

# With custom database path
python Local_to_MCard.py --input "path/to/your/file.md" --db-path "/custom/path/cards.db"
```

## Database Schema

Both scripts use the same SQLite database schema:

```sql
CREATE TABLE card (
    hash TEXT PRIMARY KEY,  -- SHA256 hash of content
    content TEXT NOT NULL,  -- JSON formatted content
    g_time TEXT NOT NULL   -- Timestamp in format: sha256|ISO8601_UTC|ASIA
);
```

### Content JSON Structure

Content is stored in the following JSON format:
```json
{
    "dimensionType": "abstractSpecification",
    "context": "actual_content_here",
    "goal": "",
    "successCriteria": ""
}
```

## Requirements

- Python 3.6+
- Required Python packages:
  - requests
  - pathlib
  - sqlite3 (usually included with Python)

## Installation

1. Clone the repository
2. Install required packages:
```bash
pip install requests pathlib
```

## Notes

- Both scripts create the database and required tables automatically if they don't exist
- The database path defaults to `../public/data/cards.db` relative to the script location
- For Google Docs, only public documents are supported
- All content is stored as UTF-8 text
- Timestamps are always in UTC with ASIA suffix
