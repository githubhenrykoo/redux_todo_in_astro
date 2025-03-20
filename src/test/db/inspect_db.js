#!/usr/bin/env node

/**
 * This script helps inspect the SQLite database after test runs
 * Run with: node src/test/db/inspect_db.js
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const DB_PATH = path.resolve(__dirname, 'redux+sqlite-integration.db');
const FALLBACK_PATH = path.resolve(__dirname, 'test_cards.db');

async function inspectDatabase(dbPath) {
  console.log(`\n==== Inspecting database: ${dbPath} ====`);
  
  try {
    const stats = await fs.stat(dbPath);
    console.log(`Database file exists: ${dbPath}`);
    console.log(`File size: ${stats.size} bytes`);
    
    // Open database and inspect tables
    try {
      const db = new Database(dbPath);
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      
      console.log('\nTables in database:');
      tables.forEach(table => console.log(`- ${table.name}`));
      
      // For each table, show row count
      console.log('\nRow counts:');
      tables.forEach(table => {
        try {
          const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
          console.log(`- ${table.name}: ${count.count} rows`);
        } catch (err) {
          console.log(`- ${table.name}: Error getting count - ${err.message}`);
        }
      });
      
      // Print some sample data from the card table
      try {
        const cards = db.prepare('SELECT hash, g_time FROM card LIMIT 5').all();
        
        if (cards.length > 0) {
          console.log('\nSample data from card table:');
          cards.forEach(card => {
            console.log(`- Hash: ${card.hash.substring(0, 10)}..., Time: ${card.g_time.substring(0, 10)}...`);
          });
        }
      } catch (err) {
        console.log(`\nError querying card table: ${err.message}`);
      }
      
      // Clean up
      db.close();
      
      return true;
    } catch (err) {
      console.error(`Error opening database: ${err.message}`);
      return false;
    }
  } catch (err) {
    console.log(`Database file not found at ${dbPath}`);
    return false;
  }
}

async function main() {
  console.log('Checking database files...');
  
  let foundAnyDatabase = false;
  
  // Check original file
  if (await inspectDatabase(DB_PATH)) {
    foundAnyDatabase = true;
  }
  
  // Try fallback if no database found
  if (!foundAnyDatabase) {
    console.log(`\nTrying fallback database...`);
    await inspectDatabase(FALLBACK_PATH);
  }
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
