import { SQLiteConnection } from '../engine/sqlite_engine';

export function initializeDatabase() {
  try {
    const engine = SQLiteConnection.getInstance();
    
    // Ensure database is set up
    engine.setup_database();
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

export function checkDatabaseContents() {
  try {
    const engine = SQLiteConnection.getInstance();
    const query = 'SELECT COUNT(*) as count FROM card WHERE json_extract(metadata, "$.source") = "redux-state"';
    const result = engine.executeQuery(query);
    
    console.log('Redux State Entries in Database:', result[0].count);
  } catch (error) {
    console.error('Error checking database:', error);
  }
}
