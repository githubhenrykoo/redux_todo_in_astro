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
  });
  
  server.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
  });
  
  // Wait for server to start
  for (let i = 0; i < 30; i++) {
    const running = await isServerRunning('http://localhost:4321');
    if (running) {
      console.log('Dev server started successfully');
      await sleep(3000); // Wait for full initialization
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
    const sqliteEngine = new SQLiteEngine();
    const page = sqliteEngine.get_all();
    const cardEntries = page.items;
    
    console.log('\n🔍 Database Contents:');
    console.log(`Found ${cardEntries.length} card entries`);
    
    // Convert content to string if it's a Buffer
    const formattedEntries = cardEntries.map(entry => {
      let contentStr = entry.content;
      
      // If content is an object but not a string or buffer, stringify it
      if (typeof contentStr === 'object' && contentStr !== null && !(contentStr instanceof Buffer)) {
        try {
          contentStr = JSON.stringify(contentStr);
        } catch (e) {
          console.log('Failed to stringify content object:', e.message);
          contentStr = '[Complex Object]';
        }
      } else if (contentStr instanceof Buffer) {
        try {
          contentStr = contentStr.toString('utf8');
        } catch (e) {
          console.log('Failed to convert Buffer to string:', e.message);
          contentStr = '[Buffer]';
        }
      }
      
      // Try to parse if it looks like JSON
      let parsedContent = contentStr;
      if (typeof contentStr === 'string' && 
          (contentStr.startsWith('{') || contentStr.startsWith('['))) {
        try {
          parsedContent = JSON.parse(contentStr);
        } catch (e) {
          console.log('Failed to parse content as JSON:', e.message);
        }
      }
      
      return {
        ...entry,
        contentObj: parsedContent,
        contentString: contentStr
      };
    });
    
    if (initialState) {
      const initialHashes = initialState.map(entry => entry.hash);
      console.log('Initial hashes:', initialHashes);
      
      const newEntries = formattedEntries.filter(entry => 
        !initialHashes.includes(entry.hash)
      );
      
      console.log(`\n✨ New Entries Added: ${newEntries.length}`);
      
      for (const entry of newEntries) {
        console.log('\n📦 New Entry:');
        console.log('Hash:', entry.hash);
        
        // Properly display content
        if (typeof entry.contentObj === 'object' && entry.contentObj !== null) {
          console.log('Content Sample (JSON):', 
            JSON.stringify(entry.contentObj, null, 2).substring(0, 500) + 
            (JSON.stringify(entry.contentObj).length > 500 ? '...' : '')
          );
        } else {
          console.log('Content Sample:', 
            String(entry.contentString).substring(0, 200) + 
            (entry.contentString.length > 200 ? '...' : '')
          );
        }
        console.log('Timestamp:', entry.g_time);
        console.log('Content Type:', typeof entry.content);
      }

      if (newEntries.length === 0) {
        console.warn('❓ No new state entries were captured during the test');
        // Don't throw an error, just log a warning
      }
    }
    
    return cardEntries;
  } catch (error) {
    console.error('❌ Database check error:', error);
    throw error;
  }
}

async function main() {
  // Start or connect to dev server
  devServer = await startDevServer();
  
  // Launch browser
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 100,
    args: ['--window-size=1280,800']
  });

  try {
    // First, get initial database state
    const sqliteEngine = new SQLiteEngine();
    const initialPage = sqliteEngine.get_all();
    const initialEntries = initialPage.items;
    console.log(`Initial database entries: ${initialEntries.length}`);
    
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    
    // Enable request capturing for debugging auto-save API calls
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/store-card')) {
        console.log('💾 Detected auto-save request to:', url);
      }
    });
    
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/api/store-card')) {
        console.log(`💾 Auto-save response: ${response.status()} ${response.statusText()}`);
        try {
          const responseBody = await response.json();
          console.log('Response data:', responseBody);
        } catch (e) {
          console.log('Could not parse response JSON');
        }
      }
    });
    
    // Navigate to the development server
    console.log('Navigating to development server...');
    await page.goto('http://localhost:4321', { waitUntil: 'networkidle0' });
    await sleep(5000); // Wait longer for initial load and first auto-save
    
    // Check if auto-save is enabled and force a save
    console.log('Looking for auto-save indicator and manual save button...');
    const autoSaveText = await page.evaluate(() => {
      const autoSaveButton = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent && btn.textContent.includes('Auto-save'));
      return autoSaveButton ? autoSaveButton.textContent : null;
    });
    
    console.log('Auto-save status:', autoSaveText || 'Not found');
    
    // Force a save by clicking the save button
    console.log('Forcing a manual save...');
    const saveButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(btn => {
        return btn.title && btn.title.includes('save');
      });
      if (saveBtn) {
        saveBtn.click();
        return true;
      }
      return false;
    });
    
    console.log('Save button clicked:', saveButton ? 'Yes' : 'No');
    await sleep(3000); // Wait for save to complete
    
    // Add some todo items to change state
    console.log('Adding todo items...');
    
    // Check if we can find the todo input field
    const todoInput = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const todoInput = inputs.find(input => {
        return input.placeholder && 
          (input.placeholder.toLowerCase().includes('todo') || 
           input.placeholder.toLowerCase().includes('task'));
      });
      
      if (todoInput) {
        console.log('Found todo input with placeholder:', todoInput.placeholder);
        return true;
      }
      return false;
    });
    
    console.log('Todo input found:', todoInput ? 'Yes' : 'No');
    
    if (todoInput) {
      // Type in the todo input and press Enter
      for (const todoText of ['Test Todo 1', 'Test Todo 2', 'Test Todo 3']) {
        await page.type('input[placeholder*="todo" i], input[placeholder*="task" i]', todoText);
        await page.keyboard.press('Enter');
        console.log(`Added todo: ${todoText}`);
        await sleep(2000); // Wait for auto-save
      }
    } else {
      console.log('Could not find todo input, trying to interact with panels instead');
    }
    
    // Find and interact with panel change buttons
    console.log('Locating panel change buttons...');
    try {
      const todoLayoutBtn = await page.waitForSelector('#todoLayoutBtn', { timeout: 5000 });
      const generateLayoutBtn = await page.waitForSelector('#generateLayoutBtn', { timeout: 5000 });
      console.log('Found panel buttons');
      
      // Interact with buttons
      const buttons = [todoLayoutBtn, generateLayoutBtn];
      
      // Interact with each button
      for (let i = 0; i < buttons.length; i++) {
        console.log(`Clicking panel button ${i + 1}`);
        
        // Click the button
        await buttons[i].click();
        await sleep(3000); // Wait longer for state update and auto-save
        
        // Take a screenshot after each button click
        await page.screenshot({ 
          path: path.join(DATA_DIR, `screenshot-panel-${i + 1}.png`) 
        });
        console.log(`Saved screenshot for panel ${i + 1}`);
      }
    } catch (error) {
      console.warn('Could not find panel buttons:', error.message);
      console.log('Trying to interact with general UI elements instead...');
      
      // Try to click on various UI elements to trigger state changes
      await page.evaluate(() => {
        // Click on any buttons or interactive elements
        const interactiveElements = [
          ...document.querySelectorAll('button'),
          ...document.querySelectorAll('a'),
          ...document.querySelectorAll('.panel')
        ];
        
        interactiveElements.slice(0, 5).forEach(el => {
          console.log('Clicking on element:', el);
          el.click();
        });
      });
      
      await sleep(5000); // Wait for interactions and auto-save
    }
    
    // Force one final manual save
    console.log('Forcing final manual save...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(btn => {
        return btn.title && btn.title.includes('save');
      });
      if (saveBtn) {
        saveBtn.click();
        return true;
      }
      return false;
    });
    
    await sleep(5000); // Wait for final save
    
    // Check database contents and changes
    console.log('\nChecking database contents...');
    const finalEntries = await checkDatabaseChanges(initialEntries);

    console.log('\n✅ State Capture Test Completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
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
