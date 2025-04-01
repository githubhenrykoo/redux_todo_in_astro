// Script to clean the cards database safely
import { getStoreEngine } from '../src/utils/storeAdapter.js';
import logger from '../src/services/logger.js';

async function cleanDatabase() {
  try {
    console.log('Starting database cleanup...');
    
    // Get the database engine
    const engine = getStoreEngine();
    
    // Execute the delete operation
    await engine.run_statement('DELETE FROM card');
    
    // Vacuum the database to reclaim space
    await engine.run_statement('VACUUM');
    
    console.log('Database cleaned successfully!');
  } catch (error) {
    console.error('Error cleaning database:', error);
  }
}

// Run the cleanup
cleanDatabase();
