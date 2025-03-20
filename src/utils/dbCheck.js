import { SQLiteEngine } from '../engine/sqlite_engine';

export async function checkDatabaseContents() {
  try {
    const engine = SQLiteEngine.getInstance();
    const query = 'SELECT COUNT(*) as count FROM card WHERE json_extract(metadata, "$.source") = "redux-state"';
    const result = await engine.executeQuery(query);
    
    console.log('Redux State Entries in Database:', result[0].count);
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

// Optionally, call this periodically or on specific events
export function setupDatabaseLogging() {
  setInterval(checkDatabaseContents, 30000); // Check every 30 seconds
}
