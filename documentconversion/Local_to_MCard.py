#!/usr/bin/env python3
"""
Local Files to MCard Loader

This script processes local files and adds them to the MCard database:
1. Read local markdown files
2. Add the content to the MCard database in the required JSON format
3. Generate a summary of processed files

Usage:
    python local_to_mcard.py [--db-path DB_PATH] [--input FILE]

Options:
    --db-path    Custom path for the database file (optional)
    --input      Path to the local markdown file to process
"""
import argparse
import datetime
import hashlib
import json
import logging
import os
import sqlite3
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Supported file extensions
SUPPORTED_EXTENSIONS = {
    '.md': 'text/markdown'
}

# Default paths
DEFAULT_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public', 'data', 'cards.db')
DEFAULT_DOWNLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'downloads')

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Reduce log verbosity
for logger_name in ['mcard.model.card_collection', 'mcard.engine.sqlite_engine', 'root']:
    logging.getLogger(logger_name).setLevel(logging.WARNING)


def read_local_file(file_path: str) -> Optional[str]:
    """
    Read content from a local markdown file.
    
    Args:
        file_path (str): Path to the local markdown file
        
    Returns:
        str: The file content as text, or None if reading failed
    """
    try:
        path = Path(file_path)
        if not path.exists():
            print(f"File not found: {file_path}")
            return None
            
        if path.suffix.lower() != '.md':
            print(f"Unsupported file type: {path.suffix}. Only .md files are supported.")
            return None
            
        print(f"Reading file: {path.name}...")
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
            
    except Exception as e:
        print(f"Error reading file: {e}")
        return None


def download_public_doc(doc_id: str, output_format: str = 'md') -> Optional[str]:
    """
    Download a public Google Doc and return its content as text.
    
    Args:
        doc_id (str): The ID of the Google Doc
        output_format (str): The desired output format (default: md)
        
    Returns:
        str: The document content as text, or None if download failed
    """
    # Validate the output format
    if output_format not in EXPORT_FORMATS:
        valid_formats = ', '.join(EXPORT_FORMATS.keys())
        raise ValueError(f"Invalid format: {output_format}. Valid formats are: {valid_formats}")
    
    # Construct the export URL
    export_url = f"https://docs.google.com/document/d/{doc_id}/export?format={EXPORT_FORMATS[output_format]}"
    
    try:
        # Send a GET request to download the file
        print(f"Downloading document as {output_format}...")
        response = requests.get(export_url)
        
        # Check if the request was successful
        response.raise_for_status()
        
        # Return the content directly as text
        if output_format == 'md':
            return response.text
        else:
            print(f"Format {output_format} not supported for direct text processing")
            return None
        
    except requests.exceptions.RequestException as e:
        print(f"Error downloading document: {e}")
        if hasattr(e, 'response') and e.response and e.response.status_code == 404:
            print("This might be because the document is not public or the document ID is incorrect.")
        return None


def download_all_formats(doc_url_or_id: str, output_dir: Optional[str] = None) -> List[str]:
    """
    Download a Google Doc in all supported formats.
    
    Args:
        doc_url_or_id (str): Google Doc ID or URL
        output_dir (str, optional): Directory to save the files. If None,
                                   the files will be saved to the default downloads directory.
        
    Returns:
        list: Paths to the downloaded files
    """
    # Extract the document ID
    doc_id = extract_doc_id(doc_url_or_id)
    
    # Use default download directory if not specified
    if not output_dir:
        output_dir = DEFAULT_DOWNLOAD_DIR
        
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Download in all formats
    downloaded_files = []
    for format_name in EXPORT_FORMATS.keys():
        try:
            file_path = download_public_doc(doc_id, format_name, output_dir)
            if file_path:
                downloaded_files.append(file_path)
        except Exception as e:
            print(f"Error downloading {format_name} format: {e}")
    
    return downloaded_files


def print_summary(processed_files: List[Dict[str, Any]]) -> None:
    """Print a summary of the processed files."""
    if not processed_files:
        print("No files were processed.")
        return
        
    print("\nProcessed Files Summary:")
    print("=" * 100)
    print(f"{'Original Filename':<40} {'MCard Hash':<40} {'Content Type'}")
    print("-" * 100)
    
    type_count = {}
    
    for file_info in processed_files:
        if file_info is None:
            continue
            
        # Count content types
        content_type = file_info.get('content_type', 'unknown')
        type_count[content_type] = type_count.get(content_type, 0) + 1
        
        # Print file info
        print(f"{file_info.get('filename', 'unknown'):<40} {file_info.get('hash', 'N/A'):<40} {content_type}")
    
    # Print type distribution
    print("\nContent Type Distribution:")
    print("=" * 40)
    for content_type, count in type_count.items():
        print(f"{content_type:<40}: {count}")
    print("-" * 40)
    print(f"Total: {len(processed_files)} files processed\n")


def ensure_table_exists(db_path: str) -> None:
    """
    Create the card table if it doesn't exist.
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS card (
            hash TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            g_time TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()


def process_content(content: str, filename: str, db_path: str) -> Dict[str, Any]:
    """
    Process downloaded files and add them to the MCard database.
    
    Args:
        file_paths (List[str]): List of paths to downloaded files
        db_path (str): Path to the database file
        
    Returns:
        List[Dict[str, Any]]: Information about processed files
    """
    try:
        print(f"Processing {filename}...")
            
        # Create metadata as a JSON string
        metadata = json.dumps({
            "dimensionType": "abstractSpecification",
            "context": content,
            "goal": "",
            "successCriteria": ""
        })
        
        # Create a unique hash based on content
        content_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
        
        # Format timestamp in the required format
        timestamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%fZ')
        g_time = f"sha256|{timestamp}|ASIA"
            
        # Add to database using SQLite
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Insert into the card table as text
        cursor.execute(
            'INSERT OR REPLACE INTO card (hash, content, g_time) VALUES (?, ?, ?)',
            (content_hash, metadata, g_time)
        )
        
        # Commit and close
        conn.commit()
        conn.close()
            
        result = {
            'filename': filename,
            'hash': content_hash,
            'content_type': 'text/markdown'
        }
        
        print(f"Successfully processed {filename}")
        return result
                
    except Exception as e:
        print(f"Error processing content: {str(e)}")
        import traceback
        print(f"Detailed error: {traceback.format_exc()}")
        return None


def main():
    """Main function to process local files and add them to MCard."""
    parser = argparse.ArgumentParser(
        description="Process local markdown files and add them to MCard database.")
    
    parser.add_argument(
        "--input",
        required=True,
        help="Path to the local markdown file to process"
    )
    
    parser.add_argument(
        "--db-path",
        type=str,
        help="Path to the database file (optional)"
    )
    
    args = parser.parse_args()
    
    # Use direct SQLite connection to ensure correct database path
    db_path = args.db_path if args.db_path else DEFAULT_DB_PATH
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    # Ensure the table exists
    ensure_table_exists(db_path)
    
    print("\nGoogle Docs to MCard Loader")
    print("=" * 70)
    
    try:
        # Read the local file
        input_path = args.input
        content = read_local_file(input_path)
        
        if not content:
            print("No content was read. Please check the file path and try again.")
            return 1
            
        # Process the content
        print(f"\nAdding content to MCard database...")
        processed_file = process_content(content, Path(input_path).name, db_path)
        processed_files = [processed_file] if processed_file else []
        
        # Print summary
        print_summary(processed_files)
        
        # Print collection stats
        # Get the count of cards in the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM card')
        count = cursor.fetchone()[0]
        conn.close()
        print(f"\nDatabase now contains {count} cards")
        
    except Exception as e:
        print(f"Error processing Google Doc: {str(e)}")
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
