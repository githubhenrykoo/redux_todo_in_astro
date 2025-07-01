#!/usr/bin/env python3
"""
Google Docs to MCard Loader

This script combines functionality from googledocs.py and Content_Loader.py to:
1. Download public Google Docs documents in various formats
2. Automatically add the downloaded documents to the MCard database
3. Generate a summary of processed files

Usage:
    python googledocs_to_mcard.py [--db-path DB_PATH] [--doc-url DOC_URL] [--format FORMAT] [--all-formats]

Options:
    --db-path      Custom path for the database file (optional)
    --doc-url      Google Doc URL or ID to download and process
    --format       Output format (default: md, options: docx, odt, rtf, pdf, txt, html, epub, md)
    --all-formats  Download and process all available formats
    --output-dir   Directory to save downloaded files (default: data/downloads)
"""
import argparse
import datetime
import hashlib
import json
import logging
import os
import re
import sqlite3
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse, parse_qs
import requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Mapping of file extensions to export format parameters for Google Docs
EXPORT_FORMATS = {
    'docx': 'docx',
    'odt': 'odt',
    'rtf': 'rtf',
    'pdf': 'pdf',
    'txt': 'txt',
    'html': 'zip',  # HTML is exported as a zip file
    'epub': 'epub',
    'md': 'md',
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


def extract_doc_id(doc_url_or_id: str) -> str:
    """
    Extract the document ID from a Google Docs URL or return the ID if already provided.
    
    Args:
        doc_url_or_id (str): Google Docs URL or document ID
        
    Returns:
        str: The document ID
    """
    # Check if it's a URL
    if doc_url_or_id.startswith('http'):
        # Parse the URL
        parsed_url = urlparse(doc_url_or_id)
        
        # Extract document ID from different URL formats
        if 'docs.google.com' in parsed_url.netloc:
            # Format: https://docs.google.com/document/d/{doc_id}/edit
            match = re.search(r'/document/d/([^/]+)', parsed_url.path)
            if match:
                return match.group(1)
                
            # Check for the 'id' query parameter (older format)
            query_params = parse_qs(parsed_url.query)
            if 'id' in query_params:
                return query_params['id'][0]
        
        # Format: https://drive.google.com/file/d/{doc_id}/view
        if 'drive.google.com' in parsed_url.netloc:
            match = re.search(r'/file/d/([^/]+)', parsed_url.path)
            if match:
                return match.group(1)
    
    # If not a URL or couldn't extract ID, assume it's already an ID
    return doc_url_or_id


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
            "dimensionType":"abstractSpecification",
            "context":content,
            "goal":"",
            "successCriteria":""
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
    """Main function to download Google Docs and add them to MCard."""
    parser = argparse.ArgumentParser(
        description="Download Google Docs and add them to MCard database.")
    
    parser.add_argument(
        "--doc-url",
        required=True,
        help="Google Doc URL or ID to download and process"
    )
    
    parser.add_argument(
        "--db-path",
        type=str,
        help="Path to the database file (optional)"
    )
    
    parser.add_argument(
        "--format",
        choices=list(EXPORT_FORMATS.keys()),
        default="md",
        help="Output format (default: md)"
    )
    
    parser.add_argument(
        "--all-formats",
        action="store_true",
        help="Download and process all available formats"
    )
    
    parser.add_argument(
        "--output-dir",
        type=str,
        default=DEFAULT_DOWNLOAD_DIR,
        help=f"Directory to save downloaded files (default: {DEFAULT_DOWNLOAD_DIR})"
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
        # Extract the document ID
        doc_id = extract_doc_id(args.doc_url)
        print(f"Processing Google Doc ID: {doc_id}")
        
        # Create output directory if it doesn't exist
        os.makedirs(args.output_dir, exist_ok=True)
        
        # Download and process the document
        print(f"Downloading document in markdown format...")
        content = download_public_doc(doc_id)
        
        if not content:
            print("No content was downloaded. Please check the document URL and try again.")
            return 1
            
        # Process the content
        print(f"\nAdding content to MCard database...")
        processed_file = process_content(content, f"gdoc_{doc_id}.md", db_path)
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
