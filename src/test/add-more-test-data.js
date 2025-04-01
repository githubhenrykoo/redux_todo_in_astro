/**
 * Add more test data to the ContentTypeInterpreter test database
 * 
 * This script adds additional file types to the test database to verify 
 * content type detection across a wider range of formats
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import crypto from 'crypto';

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test data paths
const testDataDir = path.join(__dirname, 'test_data');
const dbPath = path.join(testDataDir, 'test-cards.db');

// Create more test data files
async function createTestFiles() {
  console.log('Creating additional test files...');
  
  // HTML test file
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Test HTML File</title>
</head>
<body>
  <h1>HTML Test</h1>
  <p>This is a test HTML file for content type detection.</p>
</body>
</html>`;
  fs.writeFileSync(path.join(testDataDir, 'test-html.html'), htmlContent);
  
  // CSS test file
  const cssContent = `body {
  font-family: Arial, sans-serif;
  color: #333;
  background-color: #f5f5f5;
}

h1 {
  color: #0066cc;
  border-bottom: 1px solid #ddd;
}`;
  fs.writeFileSync(path.join(testDataDir, 'test-css.css'), cssContent);
  
  // JavaScript test file
  const jsContent = `function testFunction() {
  console.log('Testing content type detection');
  
  const result = {
    success: true,
    message: 'JavaScript file detected correctly'
  };
  
  return result;
}

// Export for testing
export default testFunction;`;
  fs.writeFileSync(path.join(testDataDir, 'test-js.js'), jsContent);
  
  // SQL test file
  const sqlContent = `CREATE TABLE test_table (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  value INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO test_table (name, value) VALUES 
('test1', 100),
('test2', 200),
('test3', 300);

SELECT * FROM test_table WHERE value > 150;`;
  fs.writeFileSync(path.join(testDataDir, 'test-sql.sql'), sqlContent);
  
  // Markdown test file
  const mdContent = `# Content Type Detection Test
  
## Markdown Test File

This is a *markdown* file used to test the **content type detection** functionality.

### Features Tested:
- File signatures
- Text-based content detection
- MIME type mapping

\`\`\`javascript
function test() {
  return "Testing code blocks in markdown";
}
\`\`\`

> This is a blockquote for testing purposes.
`;
  fs.writeFileSync(path.join(testDataDir, 'test-markdown.md'), mdContent);
  
  // YAML test file
  const yamlContent = `# Test YAML file
version: '3'
services:
  app:
    image: node:16
    volumes:
      - ./:/app
    working_dir: /app
    environment:
      - NODE_ENV=development
    ports:
      - "3000:3000"
    command: npm start
    
config:
  debug: true
  logging: verbose
  features:
    - content-detection
    - file-type-icons
    - database-storage`;
  fs.writeFileSync(path.join(testDataDir, 'test-yaml.yml'), yamlContent);
  
  // Create a simple SVG file
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
  <text x="50" y="50" font-family="Verdana" font-size="10" text-anchor="middle" alignment-baseline="middle" fill="white">SVG Test</text>
</svg>`;
  fs.writeFileSync(path.join(testDataDir, 'test-svg.svg'), svgContent);
  
  // CSV test file
  const csvContent = `id,name,value,description
1,Item 1,100,"This is item 1 for testing"
2,Item 2,200,"Content type detection test"
3,Item 3,300,"CSV format test"
4,Item 4,400,"File type icon test"`;
  fs.writeFileSync(path.join(testDataDir, 'test-csv.csv'), csvContent);
  
  // JSON with Redux state pattern
  const reduxStateContent = `{
  "state": {
    "todos": [
      {"id": 1, "text": "Test content detection", "completed": false},
      {"id": 2, "text": "Implement file type icons", "completed": true},
      {"id": 3, "text": "Write unit tests", "completed": false}
    ],
    "filters": {
      "status": "all",
      "colors": []
    },
    "loading": false
  }
}`;
  fs.writeFileSync(path.join(testDataDir, 'test-redux-state.json'), reduxStateContent);
  
  console.log('Test files created successfully.');
  return {
    html: htmlContent,
    css: cssContent,
    js: jsContent,
    sql: sqlContent,
    md: mdContent,
    yaml: yamlContent,
    svg: svgContent,
    csv: csvContent,
    reduxState: reduxStateContent
  };
}

// Add test files to database
async function addFilesToDatabase(files) {
  if (!fs.existsSync(dbPath)) {
    console.error('Test database not found:', dbPath);
    console.log('Please run npm run test:setup-db first to create the database.');
    return false;
  }
  
  console.log('Adding test files to database...');
  
  try {
    const db = new sqlite3.Database(dbPath);
    
    // First check how many records we already have
    const countResult = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM card', [], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
    
    console.log(`Database already has ${countResult.count} records`);
    
    // Now insert new records
    const fileEntries = Object.entries(files);
    const timestamp = new Date().toISOString();
    
    // Use transactions for better performance
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        const stmt = db.prepare('INSERT INTO card (hash, content, g_time) VALUES (?, ?, ?)');
        
        fileEntries.forEach(([fileType, content]) => {
          // Generate a unique hash for each file
          const hash = crypto.createHash('sha256')
            .update(`${fileType}-${Date.now()}-${Math.random()}`)
            .digest('hex');
            
          // Insert into database
          stmt.run(hash, content, timestamp);
          console.log(`Added ${fileType} file with hash: ${hash.substring(0, 8)}...`);
        });
        
        stmt.finalize();
        
        db.run('COMMIT', (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
    
    // Verify the new record count
    const newCountResult = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM card', [], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
    
    console.log(`Database now has ${newCountResult.count} records`);
    console.log(`Added ${newCountResult.count - countResult.count} new records`);
    
    db.close();
    return true;
  } catch (error) {
    console.error('Error adding files to database:', error);
    return false;
  }
}

// Run the main function
async function main() {
  try {
    const files = await createTestFiles();
    const success = await addFilesToDatabase(files);
    
    if (success) {
      console.log('Successfully added test files to database');
      console.log('You can now run: npm run test:content-detector:simple');
    } else {
      console.error('Failed to add test files to database');
    }
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

main();
