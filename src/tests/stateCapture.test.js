import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

// Import SQLite engine from the project
import { SQLiteEngine } from '../engine/sqlite_engine.js';
import { CARDS_DB_PATH } from '../config/config_constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let devServer = null;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isServerRunning(url) {
  return new Promise((resolve) => {
    http.get(url, () => {
      resolve(true);
    }).on('error', () => {
      resolve(false);
    });
  });
}

async function startDevServer() {
  console.log('Checking if dev server is already running...');
  const serverRunning = await isServerRunning('http://localhost:4321');
  
  if (serverRunning) {
    console.log('Dev server already running');
    return null;
  }
  
  console.log('Starting dev server...');
  const server = spawn('npm', ['run', 'dev'], { 
    cwd: path.join(__dirname, '..', '..'),
    stdio: 'pipe'
  });
  
  server.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
    
    // Check for the "Local" URL in the output
    if (data.toString().includes('http://localhost:4321')) {
      console.log('Server is ready');
    }
  });
  
  server.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
  });
  
  // Wait for server to start
  for (let i = 0; i < 30; i++) {
    const running = await isServerRunning('http://localhost:4321');
    if (running) {
      console.log('Dev server started successfully');
      return server;
    }
    console.log('Waiting for server to start...');
    await sleep(1000);
  }
  
  console.error('Server failed to start in time');
  server.kill();
  return null;
}

async function checkDatabaseChanges(initialState) {
  try {
    // Initialize SQLite engine
    const sqliteEngine = new SQLiteEngine();
    
    // Get all cards
    const page = sqliteEngine.get_all();
    const cardEntries = page.items;
    
    console.log('\nDatabase Contents:');
    console.log(`Found ${cardEntries.length} card entries`);
    
    // Compare with initial state
    if (initialState) {
      const newEntries = cardEntries.filter(entry => 
        !initialState.some(initialEntry => 
          initialEntry.hash === entry.hash
        )
      );
      
      console.log(`\nNew Entries Added: ${newEntries.length}`);
      
      // Log details of new entries
      for (const entry of newEntries) {
        console.log('\nNew Entry:');
        console.log('Hash:', entry.hash);
        console.log('Content:', entry.content.toString());
        console.log('Timestamp:', entry.g_time);
      }
    }
    
    return cardEntries;
  } catch (error) {
    console.error('Database check error:', error);
    return [];
  }
}

async function main() {
  // Start or connect to dev server
  devServer = await startDevServer();
  
  // Launch browser
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for headless mode
    slowMo: 50 // Slow down operations to see what's happening
  });

  try {
    // First, get initial database state
    const sqliteEngine = new SQLiteEngine();
    const initialPage = sqliteEngine.get_all();
    const initialEntries = initialPage.items;
    console.log(`Initial database entries: ${initialEntries.length}`);
    
    const page = await browser.newPage();
    page.setDefaultTimeout(5000);
    
    // Navigate to the development server
    console.log('Navigating to development server...');
    await page.goto('http://localhost:4321');
    await sleep(2000); // Wait for page to load
    
    // Take a screenshot at the beginning
    await page.screenshot({ path: path.join(DATA_DIR, 'screenshot-initial.png') });
    console.log('Saved initial screenshot');
    
    // Save initial page HTML
    const initialPageContent = await page.content();
    fs.writeFileSync(path.join(DATA_DIR, 'initial-page.html'), initialPageContent);
    
    // Find and interact with panel change buttons
    console.log('Locating panel change buttons...');
    const todoLayoutBtn = await page.waitForSelector('#todoLayoutBtn');
    const generateLayoutBtn = await page.waitForSelector('#generateLayoutBtn');
    console.log('Found panel buttons');
    
    // Interact with buttons
    const buttons = [todoLayoutBtn, generateLayoutBtn];
    
    // Interact with each button
    for (let i = 0; i < buttons.length; i++) {
      console.log(`Clicking panel button ${i + 1}`);
      
      // Click the button
      await buttons[i].click();
      await sleep(1000); // Wait for state to update
      
      // Take a screenshot after each button click
      await page.screenshot({ 
        path: path.join(DATA_DIR, `screenshot-panel-${i + 1}.png`) 
      });
      console.log(`Saved screenshot for panel ${i + 1}`);
      
      // Save page HTML after button click
      const pageContent = await page.content();
      fs.writeFileSync(path.join(DATA_DIR, `page-panel-${i + 1}.html`), pageContent);
    }
    
    // Search functionality
    console.log('Interacting with search input...');
    
    // Try multiple selectors for search input
    const searchSelectors = [
      'input#search', 
      'input[placeholder="Search..."]', 
      'input[type="search"]'
    ];
    
    let searchInput = null;
    for (const selector of searchSelectors) {
      try {
        searchInput = await page.waitForSelector(selector, { timeout: 2000 });
        console.log(`Found search input with selector: ${selector}`);
        break;
      } catch {
        console.log(`Selector ${selector} not found`);
      }
    }
    
    // If search input is found, interact with it
    if (searchInput) {
      // Enter different search terms
      const searchTerms = ['test', 'todo', 'content'];
      for (const term of searchTerms) {
        console.log(`Searching for: ${term}`);
        await searchInput.type(term);
        await sleep(1000);
        
        // Take screenshot of search results
        await page.screenshot({
          path: path.join(DATA_DIR, `screenshot-search-${term}.png`)
        });
        
        // Save page HTML during search
        const searchPageContent = await page.content();
        fs.writeFileSync(path.join(DATA_DIR, `page-search-${term}.html`), searchPageContent);
        
        // Clear the search
        await page.evaluate(() => {
          const searchInput = document.querySelector('input#search, input[placeholder="Search..."], input[type="search"]');
          if (searchInput) {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            searchInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
        await sleep(500);
      }
    } else {
      console.log('No search input found');
    }
    
    // Check database contents and changes
    console.log('\nChecking database contents...');
    await checkDatabaseChanges(initialEntries);

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
    
    // Cleanup - stop dev server if we started it
    if (devServer) {
      console.log('Stopping dev server...');
      devServer.kill();
    }
  }
}

// Run the test
console.log('Starting state capture test...');
main().catch(console.error);
