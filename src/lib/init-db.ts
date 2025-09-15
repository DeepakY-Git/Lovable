import { database } from './database';

// Simple script to initialize database
async function initializeDatabase() {
  console.log('Initializing database...');
  // Database is initialized in the constructor
  console.log('Database initialized successfully');
}

initializeDatabase().catch(console.error);