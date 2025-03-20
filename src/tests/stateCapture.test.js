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
    
    if (initialState) {
      const newEntries = cardEntries.filter(entry => 
        !initialState.some(initialEntry => 
          initialEntry.hash === entry.hash
        )
      );
      
      console.log(`\n✨ New Entries Added: ${newEntries.length}`);
      
      for (const entry of newEntries) {
        console.log('\n📦 New Entry:');
        console.log('Hash:', entry.hash);
        try {
          const parsedContent = JSON.parse(entry.content.toString());
          console.log('Content:', JSON.stringify(parsedContent, null, 2));
        } catch (parseError) {
          console.log('Content (raw):', entry.content.toString());
        }
        console.log('Timestamp:', entry.g_time);
      }

      if (newEntries.length === 0) {
        throw new Error('❌ No new state entries were captured during the test');
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
    slowMo: 50
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
    await page.goto('http://localhost:4321', { waitUntil: 'networkidle0' });
    await sleep(3000);
    
    // Find and interact with panel change buttons
    console.log('Locating panel change buttons...');
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
      await sleep(2000); // Wait for state update
      
      // Take a screenshot after each button click
      await page.screenshot({ 
        path: path.join(DATA_DIR, `screenshot-panel-${i + 1}.png`) 
      });
      console.log(`Saved screenshot for panel ${i + 1}`);
    }
    
    // Check database contents and changes
    console.log('\nChecking database contents...');
    const finalEntries = await checkDatabaseChanges(initialEntries);

    console.log('\n✅ State Capture Test Completed Successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
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
