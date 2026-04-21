import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'databases');

// Ensure databases directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const MASTER_DB_PATH = path.join(DB_DIR, 'master.db');

let masterDbInstance: Database | null = null;
const userDbCache = new Map<string, Database>();

export async function getMasterDb(): Promise<Database> {
  if (masterDbInstance) {
    return masterDbInstance;
  }

  const db = await open({
    filename: MASTER_DB_PATH,
    driver: sqlite3.Database,
  });

  // Initialize master tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  masterDbInstance = db;
  return db;
}

export function getUserDbPath(username: string): string {
  // Safe username: only alphanumeric to prevent path traversal
  const safeUsername = username.replace(/[^a-zA-Z0-9]/g, '');
  return path.join(DB_DIR, `${safeUsername}.db`);
}

export async function getUserDb(username: string): Promise<Database> {
  const safeUsername = username.replace(/[^a-zA-Z0-9]/g, '');
  
  if (userDbCache.has(safeUsername)) {
    return userDbCache.get(safeUsername)!;
  }

  const dbPath = getUserDbPath(username);
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Initialize user-specific schema
  await db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  userDbCache.set(safeUsername, db);
  return db;
}
