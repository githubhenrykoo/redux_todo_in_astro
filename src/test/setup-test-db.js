// Setup test database for ContentTypeInterpreter tests
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Create test_data directory if it doesn't exist
const testDataDir = path.join(__dirname, 'test_data');
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

// Path to test database
const dbPath = path.join(testDataDir, 'test-cards.db');

// Remove existing database file if it exists
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

// Create new database
const db = new sqlite3.Database(dbPath);

// Create tables with identical structure to the production database
db.serialize(() => {
  // Create the card table with the same structure as in production
  db.run(`
    CREATE TABLE IF NOT EXISTS card (
      hash TEXT PRIMARY KEY,
      content BLOB,
      g_time TEXT
    )
  `);
  
  // Sample test data
  const testData = [
    {
      hash: '1ffd6b7c7d57e0841649c47c5fbf96840cc8f184462db37c66dba78413e50284',
      content: JSON.stringify({
        state: {
          todos: [
            { id: 1, text: 'Test todo', completed: false }
          ]
        }
      }),
      g_time: new Date().toISOString()
    },
    {
      hash: '76f4de9a0e0e6e9a5380369a3cb1fe9a25e3c69a0f158e9a07b8a9661e86e166',
      content: Buffer.from('<html><body>Test HTML content</body></html>'),
      g_time: new Date().toISOString()
    },
    {
      hash: '05814ded34f4f0f2501cc30a17a777b9008bd6fb7c1a7f844ecf760461d406c5',
      content: Buffer.from('graph TD\n    A[Start] --> B[End]'),
      g_time: new Date().toISOString()
    },
    {
      hash: '0118015f45b8fdaa49c520cc40fe6c817c8ee53544c185584c02f3666ade6acb',
      content: '@startuml\nA --> B\n@enduml',
      g_time: new Date().toISOString()
    },
    {
      hash: '2b653c0211c6db54285f59e97db1ba8368576c3062ca2aa20c8e204d1f22873d',
      content: 'digraph G { A -> B }',
      g_time: new Date().toISOString()
    }
  ];

  // Read real binary test files
  const testFiles = {
    'testPng': path.join(testDataDir, 'test-png.png'),
    'testPdf': path.join(testDataDir, 'test-pdf.pdf')
  };
  
  // Try to include binary test files if they exist
  try {
    if (fs.existsSync(testFiles.testPng)) {
      const pngBuffer = fs.readFileSync(testFiles.testPng);
      testData.push({
        hash: 'png-test-hash-' + Date.now(),
        content: pngBuffer,
        g_time: new Date().toISOString()
      });
    }
    
    if (fs.existsSync(testFiles.testPdf)) {
      const pdfBuffer = fs.readFileSync(testFiles.testPdf);
      testData.push({
        hash: 'pdf-test-hash-' + Date.now(),
        content: pdfBuffer,
        g_time: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error('Error reading binary test files:', err);
  }
  
  // Insert test data
  const stmt = db.prepare('INSERT INTO card (hash, content, g_time) VALUES (?, ?, ?)');
  testData.forEach(item => {
    stmt.run(item.hash, item.content, item.g_time);
  });
  stmt.finalize();
  
  console.log(`Test database created at ${dbPath}`);
});

// Close database connection
db.close();
