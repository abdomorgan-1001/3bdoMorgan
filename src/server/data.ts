import { Router } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getUserDb } from './db.js';

export const dataRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-change-in-production';
const ENCRYPTION_KEY = crypto.scryptSync(JWT_SECRET, 'salt', 32);
const IV_LENGTH = 16;

function encrypt(text: string) {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string) {
  if (!text) return text;
  try {
    const textParts = text.split(':');
    const ivStr = textParts.shift();
    if (!ivStr || textParts.length === 0) return text;
    const iv = Buffer.from(ivStr, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    // If decryption fails (e.g. for old unencrypted data), return raw text
    return text;
  }
}

// Middleware to authenticate
dataRouter.use((req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string; userId: number };
    // Attach username to request using type assertion for expediency
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Get user notes from their dedicated DB
dataRouter.get('/notes', async (req, res) => {
  try {
    const username = (req as any).user.username;
    const db = await getUserDb(username);
    const notes = await db.all('SELECT * FROM notes ORDER BY created_at DESC');
    
    // Decrypt standard payload back for authenticated user
    const decryptedNotes = notes.map(note => ({
      ...note,
      content: note.content ? decrypt(note.content) : note.content
    }));
    
    res.json({ notes: decryptedNotes });
  } catch (error) {
    console.error('Notes fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Create note in user's dedicated DB
dataRouter.post('/notes', async (req, res) => {
  try {
    const username = (req as any).user.username;
    const { title, content } = req.body;
    if (!title) {
       res.status(400).json({ error: 'Title is required' });
       return;
    }
    
    const db = await getUserDb(username);
    
    // Encrypt payload before SQLite insertion
    const encryptedContent = content ? encrypt(content) : '';
    
    const result = await db.run('INSERT INTO notes (title, content) VALUES (?, ?)', [title, encryptedContent]);
    res.status(201).json({ id: result.lastID, title, content });
  } catch (error) {
    console.error('Note create error:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});
